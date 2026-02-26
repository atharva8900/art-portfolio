'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, TrendingUp, Clock, AlertCircle, Users, Timer, BarChart2 } from 'lucide-react';

import AdminNav from '@/components/admin/AdminNav';
import { PipelineDonut, GrowthTrend } from '@/components/admin/charts/DashboardCharts';

interface ReferrerEntry {
    name: string;
    revenue: number;
    orders: number;
}

interface ActivityEntry {
    id: string;
    clientName: string;
    action: string;
    status: string;
    date: string;
}

interface AnalyticsData {
    financials: {
        lifetimeRevenue: number;
        activeWorkloadValue: number;
        waitlistValue: number;
    };
    pipeline: {
        pending: number;
        waitlist: number;
        accepted: number;
        in_progress: number;
        on_delivery: number;
        completed: number;
        rejected: number;
    };
    referrals: {
        referralRevenue: number;
        directRevenue: number;
        totalCommissionsPaidToReferrers: number;
        pendingPayoutsToReferrers: number;
        totalReferrerEarnings: number;
        countReferralOrders: number;
        countDirectOrders: number;
    };
    metrics: {
        avgTurnaroundDays: number | null;
        conversionRate: number | null;
    };
    topReferrers: ReferrerEntry[];
    recentActivity: ActivityEntry[];
    revenueTrend: { date: string; amount: number }[];
}

type DateRange = '30d' | 'ytd' | 'all';

const STATUS_ICON: Record<string, string> = {
    pending: '🕐',
    waitlist: '📋',
    accepted: '✅',
    in_progress: '🎨',
    on_delivery: '📦',
    completed: '🎉',
    rejected: '❌',
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function fmt(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [range, setRange] = useState<DateRange>('all');

    const fetchAnalytics = useCallback(async (r: DateRange = range) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/analytics?range=${r}`);
            if (!res.ok) {
                if (res.status === 401) throw new Error('Unauthorized');
                throw new Error('Failed to fetch analytics');
            }
            const json = await res.json();
            setData(json);
        } catch (err: unknown) {
            const e = err as Error;
            setError(e.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        fetchAnalytics(range);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range]);

    const handleRangeChange = (r: DateRange) => {
        setRange(r);
    };

    const RANGE_LABELS: { key: DateRange; label: string }[] = [
        { key: '30d', label: 'Last 30 Days' },
        { key: 'ytd', label: 'This Year' },
        { key: 'all', label: 'All Time' },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-foreground px-4 md:px-8 lg:px-12 selection:bg-accent/30">
            <AdminNav />
            <div className="max-w-7xl mx-auto space-y-10 pt-6">

                {/* Page Title Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 pt-4">
                    <div>
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-accent text-[10px] uppercase tracking-[0.3em] font-bold mb-2 block"
                        >
                            Executive Dashboard
                        </motion.span>
                        <h1 className="text-4xl md:text-5xl font-cinzel text-white leading-tight">
                            Admin Dashboard <span className="text-accent underline underline-offset-8 decoration-accent/30 decoration-1">Analytics</span>
                        </h1>
                    </div>

                    <div className="flex bg-black/40 border border-white/5 rounded-xl p-1 gap-1 self-start md:self-end shadow-inner">
                        {RANGE_LABELS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => handleRangeChange(key)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${range === key
                                    ? 'bg-accent text-black shadow-lg shadow-accent/20 scale-[1.02]'
                                    : 'text-neutral-500 hover:text-neutral-300'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading && !data && (
                    <div className="h-[60vh] flex flex-col justify-center items-center gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-2 border-accent/20 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="font-cinzel text-accent/60 text-sm tracking-widest animate-pulse">Gathering Analytics...</p>
                    </div>
                )}

                {/* Error State */}
                {!loading && error && (
                    <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-8 rounded-2xl flex flex-col items-center text-center gap-4 backdrop-blur-md">
                        <AlertCircle size={32} />
                        <div>
                            <p className="font-medium text-lg">Communication Lost</p>
                            <p className="text-sm opacity-60 mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => fetchAnalytics(range)}
                            className="mt-2 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-xs font-bold transition-all"
                        >
                            Reconnect
                        </button>
                    </div>
                )}

                {/* Dashboard Grid */}
                {!loading && !error && data && (
                    <div className="space-y-8 mb-20">
                        {/* MAIN ANALYTICS ROW: Growth and Sidebars */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                            {/* LEFT COLUMN: Main Stats & Growth (8 cols) */}
                            <div className="lg:col-span-8 space-y-8">
                                {/* Primary KPI Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <KPICard
                                        title="Lifetime Revenue"
                                        value={fmt(data.financials.lifetimeRevenue)}
                                        icon={<IndianRupee size={20} />}
                                        subtitle="Revenue captured from completed art"
                                        delay={0.1}
                                        variant="gold"
                                    />
                                    <KPICard
                                        title="Active Workload"
                                        value={fmt(data.financials.activeWorkloadValue)}
                                        icon={<TrendingUp size={20} />}
                                        subtitle="Potential revenue in the current cycle"
                                        delay={0.2}
                                        variant="blue"
                                    />
                                </div>

                                {/* Secondary KPI Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <KPICard
                                        title="Waitlist"
                                        value={fmt(data.financials.waitlistValue)}
                                        icon={<Clock size={16} />}
                                        subtitle="Unsecured demand"
                                        delay={0.3}
                                        variant="dark"
                                    />
                                    <KPICard
                                        title="Turnaround"
                                        value={data.metrics.avgTurnaroundDays !== null ? `${data.metrics.avgTurnaroundDays}d` : '—'}
                                        icon={<Timer size={16} />}
                                        subtitle="Avg. completion time"
                                        delay={0.4}
                                        variant="dark"
                                    />
                                    <KPICard
                                        title="Conversion"
                                        value={data.metrics.conversionRate !== null ? `${data.metrics.conversionRate}%` : '—'}
                                        icon={<BarChart2 size={16} />}
                                        subtitle="Requests to completed"
                                        delay={0.5}
                                        variant="dark"
                                    />
                                </div>

                                {/* Growth Trend (Expanded height for visibility) */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-2xl"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                                <TrendingUp size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-cinzel text-lg">Growth Trend</h3>
                                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">30-day cumulative revenue</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-[350px]">
                                        <GrowthTrend data={data.revenueTrend} />
                                    </div>
                                </motion.div>
                            </div>

                            {/* RIGHT COLUMN: Pipeline and Activity (4 cols) */}
                            <div className="lg:col-span-4 space-y-8">
                                {/* Pipeline Section */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-2xl"
                                >
                                    <h3 className="font-cinzel text-lg mb-8 uppercase tracking-widest text-neutral-400 text-xs font-bold">Commission Pipeline</h3>
                                    <div className="space-y-8">
                                        <div className="flex justify-center -mb-4 scale-90 origin-center">
                                            <PipelineDonut data={data.pipeline} />
                                        </div>
                                        <div className="space-y-4">
                                            {(() => {
                                                const total = Object.values(data.pipeline).reduce((a: number, b: number) => a + b, 0);
                                                return (
                                                    <>
                                                        <PipelineStage label="Pending Review" count={data.pipeline.pending} color="bg-neutral-600" total={total} />
                                                        <PipelineStage label="Waitlist" count={data.pipeline.waitlist} color="bg-yellow-600" total={total} />
                                                        <PipelineStage label="In Progress" count={data.pipeline.accepted + data.pipeline.in_progress} color="bg-blue-600" total={total} />
                                                        <PipelineStage label="On Delivery" count={data.pipeline.on_delivery} color="bg-purple-600" total={total} />
                                                        <PipelineStage label="Completed" count={data.pipeline.completed} color="bg-accent" total={total} />
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Activity Log Section (Shrunk with Scroll) */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.9 }}
                                    className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 flex flex-col max-h-[400px]"
                                >
                                    <div className="flex items-center justify-between mb-8 shrink-0">
                                        <h3 className="font-cinzel text-lg">Recent Activity</h3>
                                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        {data.recentActivity.length === 0 ? (
                                            <div className="text-center py-6 opacity-30">
                                                <p className="text-[10px] uppercase tracking-widest font-bold">No Records</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                                                {data.recentActivity.map((item) => (
                                                    <div key={item.id} className="flex items-start gap-4 relative z-10 group">
                                                        <div className="w-6 h-6 rounded-full bg-black border border-white/10 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                                            {STATUS_ICON[item.status] || '📌'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] text-white font-bold truncate group-hover:text-accent transition-colors">{item.clientName}</p>
                                                            <p className="text-[9px] text-neutral-500 mt-0.5 uppercase tracking-tighter">{item.action}</p>
                                                        </div>
                                                        <span className="text-[9px] text-neutral-600 font-bold uppercase whitespace-nowrap mt-1">{timeAgo(item.date)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* FULL WIDTH ROW: Referral Impact */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                            className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                    <Users size={24} />
                                </div>
                                <h2 className="font-cinzel text-xl tracking-wider underline underline-offset-8 decoration-white/10">Referral Impact</h2>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                {/* Col 1: Performance Summary */}
                                <div className="space-y-6">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors">
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-3">Via Referrals</p>
                                        <h4 className="text-4xl font-cinzel text-accent mb-2">{fmt(data.referrals.referralRevenue)}</h4>
                                        <p className="text-[11px] text-neutral-400 font-bold uppercase">{data.referrals.countReferralOrders} orders</p>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors">
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-3">Direct Revenue</p>
                                        <h4 className="text-4xl font-cinzel text-white mb-2">{fmt(data.referrals.directRevenue)}</h4>
                                        <p className="text-[11px] text-neutral-400 font-bold uppercase">{data.referrals.countDirectOrders} orders</p>
                                    </div>
                                </div>

                                {/* Col 2: Top Referrers (Scrollable List) */}
                                <div className="bg-black/20 border border-white/5 rounded-2xl p-8">
                                    <p className="text-[11px] text-neutral-500 uppercase tracking-[0.2em] font-bold mb-8 flex justify-between">
                                        <span>Top Referrers</span>
                                        <span className="text-[9px] text-neutral-600">Leaderboard</span>
                                    </p>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
                                        {data.topReferrers.length === 0 ? (
                                            <p className="text-[10px] text-neutral-600 italic py-10 text-center">No affiliate records</p>
                                        ) : (
                                            data.topReferrers.map((r, i) => (
                                                <div key={i} className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold group-hover:text-accent group-hover:border-accent/40 transition-all">
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] text-white font-bold group-hover:text-accent transition-colors">{r.name}</p>
                                                            <p className="text-[9px] text-neutral-500 uppercase mt-1">{r.orders} orders</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[13px] text-accent font-mono font-bold">{fmt(r.revenue)}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Col 3: Financial Health */}
                                <div className="space-y-6">
                                    <div className="bg-black/40 border border-white/5 rounded-2xl p-8 relative">
                                        <div className="absolute top-4 right-4 text-orange-400/10">
                                            <IndianRupee size={28} />
                                        </div>
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-3">Total Affiliate Earnings</p>
                                        <h4 className="text-4xl font-cinzel text-orange-400 mb-2">{fmt(data.referrals.totalReferrerEarnings)}</h4>
                                        <p className="text-[11px] text-neutral-500 font-medium italic">Earned collectively by all partners</p>
                                    </div>
                                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-8">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 text-orange-400">
                                                <AlertCircle size={20} />
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">Pending Payouts</p>
                                                <p className="text-[13px] text-neutral-100">
                                                    You owe <span className="font-bold text-white font-mono">{fmt(data.referrals.pendingPayoutsToReferrers)}</span> unpaid.
                                                </p>
                                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest opacity-60">
                                                    {fmt(data.referrals.totalCommissionsPaidToReferrers)} paid to date
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Background Texture Blur */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[5%] right-[-5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>
        </div>
    );
}

// ── redesigned sub-components ──────────────────────────────────────────────────



interface KPICardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle?: string;
    delay: number;
    variant?: 'gold' | 'blue' | 'dark';
    span?: number;
}

function KPICard({ title, value, icon, subtitle, delay, variant = 'dark' }: KPICardProps) {
    const variants = {
        gold: 'bg-accent/5 border-accent/10 hover:border-accent/30',
        blue: 'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/30',
        dark: 'bg-[#0a0a0a] border-white/5 hover:border-white/20'
    };

    const iconColors = {
        gold: 'text-accent bg-accent/10',
        blue: 'text-blue-400 bg-blue-400/10',
        dark: 'text-neutral-500 bg-white/5'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: 'easeOut' }}
            className={`relative p-6 rounded-3xl border transition-all duration-500 group overflow-hidden ${variants[variant]}`}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-white/10 transition-colors" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${iconColors[variant]}`}>
                    {icon}
                </div>
                <div className="h-6 w-12 bg-white/5 rounded-full flex items-center justify-center text-[10px] text-neutral-500 font-bold tracking-tighter group-hover:text-neutral-300 transition-colors">
                    LIVE
                </div>
            </div>

            <div className="relative z-10 space-y-1">
                <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">{title}</p>
                <h4 className="text-3xl font-cinzel text-white leading-tight">{value}</h4>
                {subtitle && <p className="text-xs text-neutral-500 pt-2 font-medium">{subtitle}</p>}
            </div>
        </motion.div>
    );
}

function PipelineStage({ label, count, color, total }: { label: string; count: number; color: string; total: number }) {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="group/stage">
            <div className="flex justify-between text-[11px] mb-2 font-bold tracking-wider uppercase">
                <span className="text-neutral-500 group-hover/stage:text-neutral-300 transition-colors">{label}</span>
                <span className="text-white tabular-nums">{count}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                    className={`h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)] ${color}`}
                />
            </div>
        </div>
    );
}
