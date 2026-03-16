import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getAllCommissions, CommissionData } from '@/lib/db/commissions';


import { checkAdminAuth } from '@/lib/auth/admin-auth';

// DATE_CUTOFF helper...

function getDateCutoff(range: string): Date | null {
    const now = new Date();
    if (range === '30d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return d;
    }
    if (range === 'ytd') {
        return new Date(now.getFullYear(), 0, 1);
    }
    return null; // 'all' — no cutoff
}

export async function GET(request: Request) {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || 'all';
        const cutoff = getDateCutoff(range);

        const allCommissions = await getAllCommissions();

        // Filter by date range if applicable
        const commissions: CommissionData[] = cutoff
            ? allCommissions.filter((c: CommissionData) => new Date(c.submitted_at) >= cutoff)
            : allCommissions;

        // ── 1. Core Financial Metrics ──────────────────────────────────────────
        let lifetimeRevenue = 0;
        let activeWorkloadValue = 0;
        let waitlistValue = 0;

        // ── 2. Status Distribution ─────────────────────────────────────────────
        const statusCounts = {
            pending: 0,
            waitlist: 0,
            accepted: 0,
            in_progress: 0,
            on_delivery: 0,
            completed: 0,
            rejected: 0
        };

        // ── 3. Referral Insights ───────────────────────────────────────────────
        let referralRevenue = 0;
        let directRevenue = 0;
        let totalCommissionsPaidToReferrers = 0;
        let pendingPayoutsToReferrers = 0;
        let countReferralOrders = 0;
        let countDirectOrders = 0;

        // ── 4. Turnaround Time ─────────────────────────────────────────────────
        let turnaroundDaysTotal = 0;
        let turnaroundCount = 0;

        // ── 5. Conversion ──────────────────────────────────────────────────────
        let totalNonRejected = 0;
        let totalCompleted = 0;

        // ── 6. Top Referrers ───────────────────────────────────────────────────
        const referrerMap: Record<string, { name: string; revenue: number; orders: number }> = {};

        commissions.forEach((c) => {
            const totalValue = (c.base_price || 0) + (c.extras_total || 0);

            // Status counts
            if (c.status in statusCounts) {
                statusCounts[c.status as keyof typeof statusCounts]++;
            }

            // Revenue buckets
            if (c.status === 'completed') {
                lifetimeRevenue += totalValue;
            } else if (['accepted', 'in_progress', 'on_delivery'].includes(c.status)) {
                activeWorkloadValue += totalValue;
            } else if (c.status === 'waitlist' || c.status === 'pending') {
                waitlistValue += totalValue;
            }

            // Referral split (only non-rejected)
            if (c.status !== 'rejected') {
                totalNonRejected++;
                if (c.status === 'completed') totalCompleted++;

                if (c.referral_code) {
                    countReferralOrders++;
                    if (c.status === 'completed') referralRevenue += totalValue;
                } else {
                    countDirectOrders++;
                    if (c.status === 'completed') directRevenue += totalValue;
                }
            }

            // Referrer payout math
            if (c.status === 'completed' && c.commission_amount) {
                if (c.payout_status === 'paid') {
                    totalCommissionsPaidToReferrers += c.commission_amount;
                } else if (!c.payout_status || c.payout_status === 'unpaid' || c.payout_status === 'requested') {
                    pendingPayoutsToReferrers += c.commission_amount;
                }
            }

            // Turnaround: submitted → updated_at (for completed commissions)
            if (c.status === 'completed' && c.updated_at) {
                const start = new Date(c.submitted_at).getTime();
                const end = new Date(c.updated_at).getTime();
                const days = (end - start) / (1000 * 60 * 60 * 24);
                if (days >= 0) {
                    turnaroundDaysTotal += days;
                    turnaroundCount++;
                }
            }

            // Top referrers map
            if (c.referral_code && c.status === 'completed') {
                const key = c.referral_code;
                const name = c.referrer_info?.name || c.referrer_info?.instagram || c.referral_code;
                if (!referrerMap[key]) {
                    referrerMap[key] = { name, revenue: 0, orders: 0 };
                }
                referrerMap[key].revenue += totalValue;
                referrerMap[key].orders++;
            }
        });

        // ── Derived metrics ────────────────────────────────────────────────────
        const avgTurnaroundDays = turnaroundCount > 0
            ? Math.round(turnaroundDaysTotal / turnaroundCount)
            : null;

        const conversionRate = totalNonRejected > 0
            ? Math.round((totalCompleted / totalNonRejected) * 100)
            : null;

        // Top 3 referrers by revenue
        const topReferrers = Object.values(referrerMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 3);

        // ── Recent Activity Feed ───────────────────────────────────────────────
        const ACTION_LABELS: Record<string, string> = {
            pending: 'submitted a new request',
            waitlist: 'was added to the waitlist',
            accepted: 'commission was accepted',
            in_progress: 'portrait is in progress',
            on_delivery: 'portrait sent for delivery',
            completed: 'commission completed',
            rejected: 'commission was rejected',
        };

        const recentActivity = [...allCommissions]
            .sort((a, b) => {
                const aDate = new Date(a.updated_at || a.submitted_at).getTime();
                const bDate = new Date(b.updated_at || b.submitted_at).getTime();
                return bDate - aDate;
            })
            .slice(0, 5)
            .map(c => ({
                id: c.id,
                clientName: c.client_name,
                action: ACTION_LABELS[c.status] || c.status,
                status: c.status,
                date: c.updated_at || c.submitted_at,
            }));

        // ── 7. Revenue Trend (Last 30 Days) ──────────────────────────────────
        const revenueTrend: { date: string; amount: number }[] = [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Generate daily slots
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

            // Calculate revenue up to this day (cumulative for completed commissions)
            // For a "trend", we often want to see cumulative growth in that period
            const cumulativeUpToDay = allCommissions.reduce((sum: number, c: CommissionData) => {
                if (c.status === 'completed' && new Date(c.submitted_at) <= d) {
                    return sum + (c.base_price || 0) + (c.extras_total || 0);
                }
                return sum;
            }, 0);

            revenueTrend.push({ date: dateStr, amount: cumulativeUpToDay });
        }

        return NextResponse.json({
            financials: {
                lifetimeRevenue,
                activeWorkloadValue,
                waitlistValue
            },
            pipeline: statusCounts,
            referrals: {
                referralRevenue,
                directRevenue,
                totalCommissionsPaidToReferrers,
                pendingPayoutsToReferrers,
                totalReferrerEarnings: totalCommissionsPaidToReferrers + pendingPayoutsToReferrers,
                countReferralOrders,
                countDirectOrders
            },
            metrics: {
                avgTurnaroundDays,
                conversionRate,
            },
            topReferrers,
            recentActivity,
            revenueTrend
        });

    } catch (error) {
        console.error('Error calculating analytics:', error);
        return NextResponse.json({ error: 'Failed to calculate analytics' }, { status: 500 });
    }
}

