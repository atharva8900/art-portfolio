'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StatsOverview from '@/components/dashboard/StatsOverview';
import ReferralCodes from '@/components/dashboard/ReferralCodes';
import EarningsHistory from '@/components/dashboard/EarningsHistory';

interface AnalyticsData {
    active_referral: {
        code: string;
        successful_referrals_count: number;
        click_count?: number;
    } | null;
    stats: {
        total_earnings: number;
        paid_earnings: number;
        available_for_payout: number;
        requested_payout: number;
        total_referrals: number;
    };
    history: Array<{
        id: string;
        client_name: string;
        status: string;
        payout_status: 'unpaid' | 'requested' | 'paid';
        amount: number;
        date: string;
        code_used: string;
    }>;
}

export default function DashboardPage() {
    const router = useRouter();
    const { status } = useSession();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        } else if (status === 'authenticated') {
            fetchAnalytics();
            // Set browser lock for referrers - they shouldn't refer themselves on their own device
            if (typeof window !== 'undefined') {
                localStorage.setItem('atharva_referral_lock', 'true');
            }
        }
    }, [status, router]);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/user/analytics');
            if (res.ok) {
                const analyticsData = await res.json();
                setData(analyticsData);
            }
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    if (!data) return null;

    return (
        <main className="min-h-screen bg-surface text-foreground">
            <Navbar />

            <div className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
                <Link href="/" className="inline-flex items-center text-neutral-400 hover:text-foreground mb-8 transition-colors group">
                    <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <div className="mb-10">
                    <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-2">Referral Dashboard</h1>
                    <p className="text-neutral-400">Track your earnings and manage your referrals.</p>
                </div>

                <StatsOverview stats={data.stats} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <ReferralCodes activeReferral={data.active_referral} />
                    </div>
                    <div className="lg:col-span-2">
                        <EarningsHistory
                            history={data.history}
                            onPayoutRequested={fetchAnalytics}
                        />
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}

