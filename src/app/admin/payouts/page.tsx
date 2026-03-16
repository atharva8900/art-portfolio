'use client';

import { useState, useEffect } from 'react';
import { Loader2, Lock, RefreshCcw, Check, X, DollarSign, ExternalLink, ChevronDown, ChevronUp, Copy, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import StatusDropdown from '@/components/admin/StatusDropdown';
import AdminNav from '@/components/admin/AdminNav';

interface ReferrerInfo {
    name?: string;
    email?: string;
    phone?: string;
    instagram?: string;
}

interface CommissionData {
    id: string;
    client_name: string;
    client_email: string;
    referral_code: string | null;
    referrer_info: ReferrerInfo | null;
    status: string;
    payout_status?: 'unpaid' | 'requested' | 'paid';
    submitted_at: string;
    commission_amount?: number;
    base_price?: number;
    extras_total?: number;
    payout_details?: string;
    is_self_referral_flag?: boolean;
    flag_reason?: string | null;
}

interface GroupedReferrals {
    [referralCode: string]: {
        referrerInfo: ReferrerInfo | null;
        totalEarnings: number;
        paidEarnings: number;
        commissions: CommissionData[];
    };
}

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com'];

const PAYOUT_OPTIONS = [
    { value: 'unpaid', label: 'Unpaid', colorClass: 'bg-neutral-700/60 text-neutral-300 border-foreground/5utral-600' },
    { value: 'requested', label: 'Requested', colorClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { value: 'paid', label: 'Paid', colorClass: 'bg-green-500/20  text-green-400  border-green-500/30' },
];

export default function AdminPayoutsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [groupedData, setGroupedData] = useState<GroupedReferrals>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [expandedCode, setExpandedCode] = useState<string | null>(null);

    // Auth Logic
    const userEmail = session?.user?.email;
    const isAuthorized = !!session && !!userEmail && ALLOWED_EMAILS.includes(userEmail.toLowerCase());

    const [confirmingAction, setConfirmingAction] = useState<{ id: string, value: string } | null>(null);

    useEffect(() => {
        if (isAuthorized) {
            fetchCommissions();
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [isAuthorized, status]);

    const fetchCommissions = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/commissions');
            if (!res.ok) {
                if (res.status === 401) { return; }
                throw new Error('Failed to fetch commissions');
            }
            const data = await res.json();
            const grouped: GroupedReferrals = {};
            (data.commissions || []).forEach((c: CommissionData) => {
                if (c.status === 'completed' && c.referral_code) {
                    if (!grouped[c.referral_code]) {
                        grouped[c.referral_code] = { referrerInfo: c.referrer_info, totalEarnings: 0, paidEarnings: 0, commissions: [] };
                    }
                    grouped[c.referral_code].commissions.push(c);
                    const amount = c.commission_amount || 0;
                    grouped[c.referral_code].totalEarnings += amount;
                    if (c.payout_status === 'paid') {
                        grouped[c.referral_code].paidEarnings += amount;
                    }
                }
            });
            setGroupedData(grouped);
        } catch (error: unknown) {
            const err = error as { message?: string };
            setError(err.message || 'Failed to load commissions');
        } finally {
            setLoading(false);
        }
    };

    const updatePayoutStatus = async (commissionId: string, value: string) => {
        setUpdatingId(commissionId);
        try {
            const res = await fetch('/api/admin/commissions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: commissionId, payout_status: value })
            });
            if (!res.ok) {
                const errData = await res.json();
                if (res.status === 401) { /* handled */ }
                else { throw new Error(errData.error || 'Failed to update payout'); }
            } else {
                await fetchCommissions();
                setConfirmingAction(null);
            }
        } catch (error: unknown) {
            const err = error as { message?: string };
            alert(err.message || 'Failed to update payout');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

    const renderPayoutDetails = (detailsJson?: string) => {
        if (!detailsJson) return <span className="text-neutral-600 italic text-xs">No details</span>;
        try {
            const details = JSON.parse(detailsJson);
            if (details.type === 'upi') {
                return (
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">UPI ID</span>
                        <span className="text-emerald-400 font-mono text-xs">{details.vpa}</span>
                    </div>
                );
            }

            if (details.type === 'bank') {
                return (
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Bank Transfer</span>
                        <div className="flex flex-col">
                            <span className="text-foreground font-mono text-xs">{details.account}</span>
                            <span className="text-neutral-400 text-[10px]">{details.ifsc} • {details.name || 'Unknown'}</span>
                        </div>
                    </div>
                );
            }
            return <span className="text-xs font-mono">{detailsJson}</span>;
        } catch {
            return <span className="text-xs font-mono">{detailsJson}</span>;
        }
    };

    const getPayoutCopyValue = (detailsJson?: string) => {
        if (!detailsJson) return '';
        try {
            const details = JSON.parse(detailsJson);
            if (details.type === 'upi') return details.vpa;

            if (details.type === 'bank') return `${details.account} ${details.ifsc}`;
            return detailsJson;
        } catch {
            return detailsJson;
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Minimal visual feedback could be added here
    };

    if (status === 'loading') {
        return <div className="min-h-screen bg-surface flex items-center justify-center"><Loader2 className="animate-spin text-accent" size={48} /></div>;
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-4">
                <div className="bg-surface border border-foreground/10 p-8 rounded-xl max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-serif text-foreground">Unauthorized Access</h1>
                    <button onClick={handleLogout} className="px-6 py-3 bg-foreground text-background font-bold rounded w-full">
                        Go to Home / Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface">
            <AdminNav />
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-surface/30 backdrop-blur-md p-8 rounded-2xl border border-foreground/5 shadow-2xl">
                    <div>
                        <h1 className="text-3xl font-serif text-foreground tracking-[0.2em] uppercase">Referral Payouts</h1>
                        <p className="text-neutral-500 text-sm mt-2 font-medium">Manage and track commission payouts for your referrers</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={fetchCommissions} disabled={loading}
                        className="bg-accent/10 text-accent px-8 py-3 border border-accent/20 hover:bg-accent/20 hover:border-foreground/10nt/40 transition-all flex items-center gap-3 rounded-lg font-bold tracking-widest uppercase text-xs">
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
                    </motion.button>
                </div>

                {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded">{error}</div>}

                {loading && Object.keys(groupedData).length === 0 ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-accent" size={32} /></div>
                ) : Object.keys(groupedData).length === 0 ? (
                    <div className="text-center py-20 bg-surface/30 border border-foreground/5 rounded-2xl">
                        <DollarSign className="mx-auto text-neutral-600 mb-4" size={48} />
                        <h3 className="text-xl font-serif text-foreground mb-2">No Payouts Yet</h3>
                        <p className="text-neutral-500 max-w-sm mx-auto">Commissions must be marked as &apos;Completed&apos; before appearing here.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedData).map(([code, data]) => {
                            const pendingEarnings = data.totalEarnings - data.paidEarnings;
                            const hasPending = pendingEarnings > 0;
                            return (
                                <motion.div key={code} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-surface border border-foreground/10 rounded-2xl overflow-hidden shadow-xl">

                                    {/* Referrer Header */}
                                    <div
                                        className="p-6 md:p-8 border-b border-foreground/5 bg-foreground/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer hover:bg-foreground/10 transition-colors relative group"
                                        onClick={() => setExpandedCode(expandedCode === code ? null : code)}
                                    >
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-600 group-hover:text-accent transition-colors">
                                            {expandedCode === code ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-xl font-serif text-foreground">{data.referrerInfo?.name || 'Unknown Referrer'}</h2>
                                                <span className="bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest">{code}</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-neutral-400">
                                                {data.referrerInfo?.email && (
                                                    <a href={`mailto:${data.referrerInfo.email}`} className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                                        {data.referrerInfo.email}<ExternalLink size={12} />
                                                    </a>
                                                )}
                                                {data.referrerInfo?.instagram && (
                                                    <a href={`https://instagram.com/${data.referrerInfo.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                                        {data.referrerInfo.instagram}<ExternalLink size={12} />
                                                    </a>
                                                )}
                                                {data.referrerInfo?.phone && <span>{data.referrerInfo.phone}</span>}
                                            </div>
                                        </div>

                                        {/* Earnings Summary */}
                                        <div className="flex items-center gap-6 bg-surface/50 p-4 rounded-xl border border-foreground/5 w-full md:w-auto">
                                            <div>
                                                <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Pending</p>
                                                <p className={`text-2xl font-bold font-mono ${hasPending ? 'text-orange-400' : 'text-neutral-400'}`}>₹{pendingEarnings}</p>
                                            </div>
                                            <div className="w-px h-10 bg-foreground/10" />
                                            <div>
                                                <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Total Paid</p>
                                                <p className="text-2xl font-bold font-mono text-emerald-400">₹{data.paidEarnings}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Commission List */}
                                    <AnimatePresence>
                                        {expandedCode === code && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-6 md:p-8 border-t border-foreground/5">
                                                    <h3 className="text-sm font-bold text-neutral-500 mb-6 tracking-widest uppercase">Eligible Commissions</h3>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse min-w-[680px]">
                                                            <thead>
                                                                <tr className="border-b border-foreground/5">
                                                                    <th className="pb-4 text-xs font-medium text-neutral-500 font-mono">Client</th>
                                                                    <th className="pb-4 text-xs font-medium text-neutral-500 font-mono">Date Finished</th>
                                                                    <th className="pb-4 text-xs font-medium text-neutral-500 font-mono">Client Paid</th>
                                                                    <th className="pb-4 text-xs font-medium text-neutral-500 font-mono">Referrer Gets</th>
                                                                    <th className="pb-4 text-xs font-medium text-neutral-500 font-mono">Payment Details</th>
                                                                    <th className="pb-4 text-xs font-medium text-neutral-500 font-mono">Payout Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {data.commissions.map((c) => {
                                                                    const clientTotal = (c.base_price || 0) + (c.extras_total || 0);
                                                                    const currentPayout = confirmingAction?.id === c.id ? confirmingAction.value : (c.payout_status || 'unpaid');
                                                                    return (
                                                                        <tr key={c.id} className="border-b border-foreground/5 last:border-0 hover:bg-foreground/5 transition-colors">
                                                                            <td className="py-4 pr-4 text-sm text-foreground">
                                                                                <div>{c.client_name}</div>
                                                                                <div className="text-xs text-neutral-500">{c.client_email}</div>
                                                                                {c.is_self_referral_flag && (
                                                                                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-400/20 w-fit" title={c.flag_reason || 'Potential Self-Referral'}>
                                                                                        <AlertTriangle size={10} />
                                                                                        SELF-REFERRAL FLAG
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                            <td className="py-4 pr-4 text-sm text-neutral-400">
                                                                                {new Date(c.submitted_at).toLocaleDateString('en-GB')}
                                                                            </td>
                                                                            <td className="py-4 pr-4">
                                                                                <div className="text-sm font-mono text-foreground">₹{clientTotal}</div>
                                                                                {c.extras_total ? (
                                                                                    <div className="text-xs text-neutral-500">Base ₹{c.base_price} + Add-ons ₹{c.extras_total}</div>
                                                                                ) : (
                                                                                    <div className="text-xs text-neutral-500">Base ₹{c.base_price}</div>
                                                                                )}
                                                                            </td>
                                                                            <td className="py-4 pr-4">
                                                                                <div className="text-sm font-mono font-bold text-accent">₹{c.commission_amount || 0}</div>
                                                                                <div className="text-xs text-neutral-500">20% commission</div>
                                                                            </td>
                                                                            <td className="py-4 pr-4">
                                                                                <div className="flex items-start gap-2 group">
                                                                                    <div className="min-w-[150px]">
                                                                                        {renderPayoutDetails(c.payout_details)}
                                                                                    </div>
                                                                                    {c.payout_details && (
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                const copyVal = getPayoutCopyValue(c.payout_details);
                                                                                                copyToClipboard(copyVal);
                                                                                            }}
                                                                                            className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground/10 rounded-md text-neutral-400 hover:text-foreground"
                                                                                            title="Copy Details"
                                                                                        >
                                                                                            <Copy size={12} />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <StatusDropdown
                                                                                        value={currentPayout}
                                                                                        options={PAYOUT_OPTIONS}
                                                                                        onChange={(val: string) => {
                                                                                            if (val === (c.payout_status || 'unpaid')) { setConfirmingAction(null); return; }
                                                                                            setConfirmingAction({ id: c.id, value: val });
                                                                                        }}
                                                                                        disabled={updatingId === c.id}
                                                                                    />
                                                                                    <AnimatePresence>
                                                                                        {confirmingAction?.id === c.id && (
                                                                                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-1.5">
                                                                                                <button onClick={() => updatePayoutStatus(c.id, confirmingAction.value)}
                                                                                                    className="w-7 h-7 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-all">
                                                                                                    <Check size={13} />
                                                                                                </button>
                                                                                                <button onClick={() => setConfirmingAction(null)}
                                                                                                    className="w-7 h-7 flex items-center justify-center bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all">
                                                                                                    <X size={13} />
                                                                                                </button>
                                                                                            </motion.div>
                                                                                        )}
                                                                                    </AnimatePresence>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
