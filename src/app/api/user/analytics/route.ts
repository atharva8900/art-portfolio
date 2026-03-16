import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import { getAllReferrals, getActiveReferralForUser } from '@/lib/db/referrals';
import { getAllCommissions } from '@/lib/db/commissions';


export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = session.user.email;
        console.log('Analytics Request (NextAuth) for:', userEmail);

        // 1. Get Active Referral
        const activeReferral = await getActiveReferralForUser(userEmail);

        // 2. Get All User's Referrals (History)
        const allRefs = await getAllReferrals();
        const allReferrals = allRefs.filter(r =>
            r.referrer_email.toLowerCase() === userEmail.toLowerCase()
        );
        console.log(`Found ${allReferrals.length} referrals for user out of ${allRefs.length} total`);

        // 3. Get All Commissions linked to these referrals
        const allCommissions = await getAllCommissions();
        const userReferralCodes = allReferrals.map(r => r.code);
        console.log('User Referral Codes:', userReferralCodes);

        const relevantCommissions = allCommissions.filter(c =>
            c.referral_code && userReferralCodes.includes(c.referral_code)
        );
        console.log(`Found ${relevantCommissions.length} relevant commissions out of ${allCommissions.length} total`);

        // 4. Calculate Stats
        let totalEarnings = 0;
        // let pendingEarnings = 0;
        let paidEarnings = 0;
        let successfulReferralsCount = 0;

        const earningsHistory = relevantCommissions
            .filter(c => c.status !== 'rejected')
            .map(c => {
                const commissionAmount = c.commission_amount || 0;

                // If status is completed, it's earned (either paid or pending payout)
                if (c.status === 'completed') {
                    totalEarnings += commissionAmount;
                    if (c.payout_status === 'paid') {
                        paidEarnings += commissionAmount;
                    } else {
                        // Unpaid or Requested
                        // Note: users might consider "pending" as money they WILL get, 
                        // but strictly speaking, it's only "earnable" once commission is completed.
                        // For this dashboard, "Pending Balance" usually means "Ready to be paid out".
                    }
                }

                // Count successful referrals (accepted or completed)
                if (['accepted', 'completed'].includes(c.status)) {
                    successfulReferralsCount++;
                }

                return {
                    id: c.id,
                    client_name: c.client_name,
                    status: c.status,
                    payout_status: c.payout_status || 'unpaid',
                    amount: commissionAmount,
                    date: c.submitted_at,
                    code_used: c.referral_code
                };
            })
            // Sort by date desc
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Calculate "Available for Payout"
        // This is strictly commissions that are COMPLETED but NOT YET PAID
        const availableForPayout = relevantCommissions
            .filter(c => c.status === 'completed' && c.payout_status !== 'paid' && c.payout_status !== 'requested')
            .reduce((sum, c) => sum + (c.commission_amount || 0), 0);

        // Calculate "Requested Payouts"
        const requestedPayouts = relevantCommissions
            .filter(c => c.status === 'completed' && c.payout_status === 'requested')
            .reduce((sum, c) => sum + (c.commission_amount || 0), 0);

        return NextResponse.json({
            active_referral: activeReferral,
            stats: {
                total_earnings: totalEarnings, // Total value generated for referrer
                paid_earnings: paidEarnings, // Already in their bank
                available_for_payout: availableForPayout, // Actionable
                requested_payout: requestedPayouts, // In progress
                total_referrals: successfulReferralsCount,
            },
            history: earningsHistory
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

