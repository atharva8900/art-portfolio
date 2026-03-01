'use client';

import { useState, useEffect } from 'react';
import {
    Loader2, Trash2, Lock, RefreshCcw, Check, X, AlertTriangle, ChevronDown,
    Phone, Instagram, MapPin, User, Package, Calendar, Copy, ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import StatusDropdown from '@/components/admin/StatusDropdown';
import AdminNav from '@/components/admin/AdminNav';

interface CommissionData {
    id: string;
    client_name: string;
    client_email: string;
    phone: string;
    instagram_id?: string;
    size: string;
    number_of_people: string;
    address: string;
    referral_code: string | null;
    referrer_info: {
        name?: string;
        email?: string;
        phone?: string;
        instagram?: string;
    } | null;
    status: 'pending' | 'accepted' | 'in_progress' | 'finished' | 'on_delivery' | 'completed' | 'rejected' | 'waitlist';
    payout_status?: 'unpaid' | 'requested' | 'paid';
    needed_by?: string;
    submitted_at: string;
    updated_at?: string;
    admin_note?: string;
    commission_amount?: number;
    base_price?: number;
    extras_total?: number;
    detailed_background?: boolean;
    timelapse_recording?: boolean;
    razorpay_payment_link_url?: string;
    payment_status?: 'pending' | 'deposit_paid' | 'fully_paid' | 'reservation_paid';
    razorpay_payment_link_id?: string;
    shipping_cost?: number;
    final_payment_link_id?: string;
    final_payment_link_url?: string;
}

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com', 'atharvasherlekar@gmail.com'];

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending Review', colorClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { value: 'waitlist', label: 'Waitlist', colorClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { value: 'accepted', label: 'Accepted', colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { value: 'in_progress', label: 'In Progress', colorClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { value: 'finished', label: 'Artwork Finished', colorClass: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
    { value: 'on_delivery', label: 'Shipped', colorClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    { value: 'completed', label: 'Completed', colorClass: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { value: 'rejected', label: 'Rejected', colorClass: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { value: 'cancelled', label: 'Cancelled / Refunded', colorClass: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30' },
];


export default function AdminCommissionsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [commissions, setCommissions] = useState<CommissionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [generatingLinkId, setGeneratingLinkId] = useState<string | null>(null);
    const [commissionToDelete, setCommissionToDelete] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [shippingCosts, setShippingCosts] = useState<Record<string, string>>({});

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    // Auth Logic
    const userEmail = session?.user?.email;
    const isAuthorized = !!session && !!userEmail && ALLOWED_EMAILS.includes(userEmail.toLowerCase());

    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

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
                if (res.status === 401) {
                    return;
                }
                throw new Error('Failed to fetch commissions');
            }

            const data = await res.json();
            const sortedCommissions = (data.commissions || []).sort((a: CommissionData, b: CommissionData) =>
                new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
            );
            setCommissions(sortedCommissions);
        } catch (error: unknown) {
            const err = error as { message?: string };
            setError(err.message || 'Failed to load commissions');
        } finally {
            setLoading(false);
        }
    };

    const updateField = async (commissionId: string, value: string) => {
        setUpdatingId(commissionId);

        try {
            const body: { id: string; status?: string } = { id: commissionId, status: value };

            const res = await fetch('/api/admin/commissions', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json();
                if (res.status === 401) {
                    // Handled by NextAuth protection
                } else {
                    throw new Error(errData.error || 'Failed to update');
                }
            } else {
                const data = await res.json();
                setCommissions(prev => prev.map(c =>
                    c.id === commissionId ? data.commission : c
                ));
            }

        } catch (error: unknown) {
            const err = error as { message?: string };
            showNotification(err.message || 'Failed to update', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const generatePaymentLink = async (commissionId: string) => {
        setGeneratingLinkId(commissionId);
        try {
            const res = await fetch(`/api/admin/commissions/${commissionId}/payment-link`, {
                method: 'POST',
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to generate payment link');
            }
            const data = await res.json();
            showNotification(`Payment Link generated: ${data.link}`, 'success');
            fetchCommissions();
        } catch (error: unknown) {
            const err = error as { message?: string };
            showNotification(err.message || 'Failed to generate payment link', 'error');
        } finally {
            setGeneratingLinkId(null);
        }
    };

    const generateFinalPaymentLink = async (commissionId: string) => {
        const shippingCost = Number(shippingCosts[commissionId]) || 0;
        setGeneratingLinkId(commissionId);
        try {
            const res = await fetch(`/api/admin/commissions/${commissionId}/final-payment-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shippingCost })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to generate final payment link');
            }
            const data = await res.json();
            showNotification(`Final Payment Link generated! Total: ₹${data.finalBalance}`, 'success');
            fetchCommissions();
        } catch (error: unknown) {
            const err = error as { message?: string };
            showNotification(err.message || 'Failed to generate link', 'error');
        } finally {
            setGeneratingLinkId(null);
        }
    };

    const initiateDelete = (commissionId: string) => {
        setCommissionToDelete(commissionId);
    };

    const confirmDelete = async () => {
        if (!commissionToDelete) return;

        const commissionId = commissionToDelete;
        setCommissionToDelete(null);
        setDeletingId(commissionId);

        try {
            const res = await fetch(`/api/admin/commissions?id=${commissionId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const errData = await res.json();
                if (res.status === 401) {
                    // Handled by NextAuth protection
                } else {
                    throw new Error(errData.error || 'Failed to delete commission');
                }
            } else {
                setCommissions(prev => prev.filter(c => c.id !== commissionId));
            }

        } catch (error: unknown) {
            const err = error as { message?: string };
            showNotification(err.message || 'Failed to delete commission', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };



    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={48} />
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-4">
                <div className="bg-surface hover:bg-surface\/80 border border-foreground/10 p-8 rounded-xl max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <Lock size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif text-foreground mb-2">Unauthorized Access</h1>
                        <p className="text-neutral-400">
                            You do not have permission to view this page.
                        </p>
                        <p className="text-neutral-500 text-sm mt-2">
                            Please log in with an authorized administrator account.
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-3 bg-foreground text-background font-bold rounded hover:bg-neutral-200 transition-colors w-full"
                    >
                        Go to Home / Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface relative">
            <AdminNav />
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-surface/30 backdrop-blur-md p-8 rounded-2xl border border-foreground/5 shadow-2xl">
                    <div>
                        <h1 className="text-3xl font-serif text-foreground tracking-[0.2em] uppercase">Commission Management</h1>
                        <p className="text-neutral-500 text-sm mt-2 font-medium">Coordinate your artistic workflow and track request lifecycle</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={fetchCommissions}
                            disabled={loading}
                            className="bg-accent/10 text-accent px-8 py-3 border border-accent/20 hover:bg-accent/20 hover:border-accent/40 transition-all flex items-center gap-3 rounded-lg font-bold tracking-widest uppercase text-xs shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]"
                        >
                            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </motion.button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && commissions.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-accent" size={32} />
                    </div>
                ) : commissions.length === 0 ? (
                    <div className="text-center py-20 text-neutral-500">
                        No commissions found
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-foreground/10">
                                        <th className="text-left text-neutral-400 font-normal text-sm py-4 px-4 w-12 text-center">#</th>
                                        <th className="text-left text-neutral-400 font-normal text-sm py-4 px-4">Client</th>
                                        <th className="text-left text-neutral-400 font-normal text-sm py-4 px-4">Referral</th>
                                        <th className="text-left text-neutral-400 font-normal text-sm py-4 px-4">Status</th>
                                        <th className="text-left text-neutral-400 font-normal text-sm py-4 px-4">Submitted</th>
                                        <th className="text-right text-neutral-400 font-normal text-sm py-4 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {commissions.map((commission, index) => (
                                        <>
                                            <tr
                                                key={commission.id}
                                                className={`border-b transition-colors cursor-pointer ${expandedId === commission.id ? 'border-accent/20 bg-accent/5' : 'border-foreground/5 hover:bg-foreground/5'}`}
                                                onClick={() => toggleExpand(commission.id)}
                                            >
                                                <td className="py-4 px-4 text-neutral-500 text-center font-mono text-sm">{index + 1}</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div>
                                                            <div className="text-foreground">{commission.client_name}</div>
                                                            <div className="text-neutral-500 text-xs">{commission.client_email}</div>
                                                        </div>
                                                        <ChevronDown size={14} className={`text-neutral-500 ml-1 transition-transform duration-200 ${expandedId === commission.id ? 'rotate-180' : ''}`} />
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4" onClick={e => e.stopPropagation()}>
                                                    {commission.referral_code ? (
                                                        <span className="text-accent font-mono text-sm">{commission.referral_code}</span>
                                                    ) : (
                                                        <span className="text-neutral-600 text-xs">Direct</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 group" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center gap-3">
                                                        <StatusDropdown
                                                            value={commission.status}
                                                            options={STATUS_OPTIONS}
                                                            onChange={(val: string) => {
                                                                updateField(commission.id, val);
                                                            }}
                                                            disabled={updatingId === commission.id}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-neutral-400 text-sm">
                                                    {new Date(commission.submitted_at).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="py-4 px-4 text-right" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => initiateDelete(commission.id)}
                                                        disabled={deletingId === commission.id}
                                                        className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                                                        title="Delete Commission"
                                                    >
                                                        {deletingId === commission.id ? (
                                                            <Loader2 className="animate-spin" size={18} />
                                                        ) : (
                                                            <Trash2 size={18} />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expandable Detail Row */}
                                            <AnimatePresence>
                                                {expandedId === commission.id && (
                                                    <tr key={`${commission.id}-detail`} className="border-b border-accent/10 bg-accent/5">
                                                        <td colSpan={6} className="px-6 py-0">
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                                                                    {/* Contact */}
                                                                    <div className="space-y-3">
                                                                        <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase">Contact</p>
                                                                        <div className="flex items-center gap-2 text-sm text-foreground">
                                                                            <Phone size={13} className="text-neutral-500 shrink-0" />
                                                                            {commission.phone || <span className="text-neutral-600">—</span>}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-sm text-foreground">
                                                                            <Instagram size={13} className="text-neutral-500 shrink-0" />
                                                                            {commission.instagram_id || <span className="text-neutral-600">—</span>}
                                                                        </div>
                                                                        <div className="flex items-start gap-2 text-sm text-foreground">
                                                                            <MapPin size={13} className="text-neutral-500 shrink-0 mt-0.5" />
                                                                            <span className="leading-tight">{commission.address || <span className="text-neutral-600">—</span>}</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Order Details */}
                                                                    <div className="space-y-3">
                                                                        <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase">Order</p>
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <Package size={13} className="text-neutral-500 shrink-0" />
                                                                            <span className="text-foreground">{commission.size}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <User size={13} className="text-neutral-500 shrink-0" />
                                                                            <span className="text-foreground">{commission.number_of_people} {Number(commission.number_of_people) === 1 ? 'person' : 'people'}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-sm pt-1">
                                                                            <Calendar size={13} className="text-neutral-500 shrink-0" />
                                                                            <span className={`${commission.needed_by ? 'text-accent font-medium' : 'text-neutral-500 italic'}`}>
                                                                                {commission.needed_by
                                                                                    ? new Date(commission.needed_by).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                                                                    : 'No deadline'}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Add-ons */}
                                                                    <div className="space-y-3">
                                                                        <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase">Add-ons</p>
                                                                        {!commission.detailed_background && !commission.timelapse_recording ? (
                                                                            <span className="text-neutral-600 text-sm">None</span>
                                                                        ) : (
                                                                            <>
                                                                                {(commission as CommissionData & { detailed_background?: boolean }).detailed_background && (
                                                                                    <div className="text-sm text-emerald-400 flex items-center gap-1.5">✓ Detailed Background</div>
                                                                                )}
                                                                                {(commission as CommissionData & { timelapse_recording?: boolean }).timelapse_recording && (
                                                                                    <div className="text-sm text-emerald-400 flex items-center gap-1.5">✓ Timelapse Recording</div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {/* Financials & Referrer */}
                                                                    <div className="space-y-3">
                                                                        <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase">Financials</p>
                                                                        {commission.base_price ? (
                                                                            <div className="space-y-1 text-sm">
                                                                                <div className="flex justify-between gap-4"><span className="text-neutral-500">Base</span><span className="font-mono text-foreground">₹{commission.base_price}</span></div>
                                                                                {(commission as CommissionData & { extras_total?: number }).extras_total ? (
                                                                                    <div className="flex justify-between gap-4"><span className="text-neutral-500">Add-ons</span><span className="font-mono text-foreground">₹{(commission as CommissionData & { extras_total?: number }).extras_total}</span></div>
                                                                                ) : null}
                                                                                <div className="flex justify-between gap-4 border-t border-foreground/10 pt-1 mt-1"><span className="text-foreground font-medium">Total Artwork</span><span className="font-mono text-foreground font-bold">₹{(commission.base_price || 0) + ((commission as CommissionData & { extras_total?: number }).extras_total || 0)}</span></div>
                                                                                {commission.shipping_cost ? (
                                                                                    <div className="flex justify-between gap-4 text-pink-400 font-medium italic"><span className="">Shipping</span><span className="font-mono">₹{commission.shipping_cost}</span></div>
                                                                                ) : null}
                                                                            </div>
                                                                        ) : <span className="text-neutral-600 text-sm">—</span>}

                                                                        {commission.referrer_info && (
                                                                            <div className="mt-3 pt-3 border-t border-foreground/10">
                                                                                <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase mb-2">Referrer</p>
                                                                                <p className="text-sm text-foreground">{commission.referrer_info.name}</p>
                                                                                <p className="text-xs text-neutral-500">{commission.referrer_info.email}</p>
                                                                                {commission.commission_amount ? (
                                                                                    <div className="flex justify-between gap-4 mt-2 pt-2 border-t border-foreground/10">
                                                                                        <span className="text-neutral-400 text-sm">Commission</span>
                                                                                        <span className="font-mono text-accent font-bold text-sm">₹{commission.commission_amount}</span>
                                                                                    </div>
                                                                                ) : null}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Commission Specific Actions */}
                                                                {(commission.status === 'waitlist' || (commission.status === 'accepted' && (commission.payment_status === 'pending' || commission.payment_status === 'reservation_paid')) || (commission.status === 'finished' && commission.payment_status !== 'fully_paid') || commission.status === 'on_delivery') && (
                                                                    <div className="mt-6 pt-6 border-t border-foreground/10 flex items-center justify-between bg-accent/5 -mx-6 px-6 pb-6">
                                                                        {commission.status === 'waitlist' ? (
                                                                            <>
                                                                                <div className="flex flex-col gap-1 text-amber-400">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <AlertTriangle size={18} />
                                                                                        <p className="text-sm font-medium">Waitlist Slot</p>
                                                                                    </div>
                                                                                    {commission.payment_status === 'reservation_paid' && (
                                                                                        <p className="text-xs text-emerald-400 font-medium ml-7">✓ 25% Reservation Fee Paid</p>
                                                                                    )}
                                                                                </div>
                                                                                <motion.button
                                                                                    whileHover={{ scale: 1.02 }}
                                                                                    whileTap={{ scale: 0.98 }}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        updateField(commission.id, 'accepted');
                                                                                    }}
                                                                                    disabled={updatingId === commission.id}
                                                                                    className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-6 py-2.5 rounded-lg hover:bg-emerald-500/30 transition-all font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                                                                >
                                                                                    {updatingId === commission.id ? (
                                                                                        <Loader2 size={16} className="animate-spin" />
                                                                                    ) : (
                                                                                        <Check size={16} />
                                                                                    )}
                                                                                    Accept Waitlist Slot
                                                                                </motion.button>
                                                                            </>
                                                                        ) : commission.status === 'accepted' ? (
                                                                            <>
                                                                                {commission.razorpay_payment_link_url ? (
                                                                                    <div className="flex flex-col gap-2 w-full max-w-md">
                                                                                        <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                                                                            <Check size={16} />
                                                                                            <p className="text-sm font-medium">Deposit Payment Link Ready</p>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-lg p-2.5">
                                                                                            <p className="text-xs font-mono text-neutral-400 truncate flex-1">{commission.razorpay_payment_link_url}</p>
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    navigator.clipboard.writeText(commission.razorpay_payment_link_url || '');
                                                                                                    showNotification('Link copied to clipboard!', 'success');
                                                                                                }}
                                                                                                className="p-1.5 hover:bg-foreground/10 rounded transition-colors text-neutral-400 hover:text-foreground"
                                                                                                title="Copy Link"
                                                                                            >
                                                                                                <Copy size={14} />
                                                                                            </button>
                                                                                            <a
                                                                                                href={commission.razorpay_payment_link_url}
                                                                                                target="_blank"
                                                                                                rel="noreferrer"
                                                                                                onClick={e => e.stopPropagation()}
                                                                                                className="p-1.5 hover:bg-foreground/10 rounded transition-colors text-neutral-400 hover:text-foreground"
                                                                                                title="Open Link"
                                                                                            >
                                                                                                <ExternalLink size={14} />
                                                                                            </a>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <>
                                                                                        <div className="flex items-center gap-3 text-accent">
                                                                                            <AlertTriangle size={18} />
                                                                                            <p className="text-sm font-medium">
                                                                                                {commission.payment_status === 'reservation_paid'
                                                                                                    ? 'Client paid 25%. Remaining 25% needed to begin.'
                                                                                                    : 'Client needs to pay the 50% deposit.'}
                                                                                            </p>
                                                                                        </div>
                                                                                        <motion.button
                                                                                            whileHover={{ scale: 1.02 }}
                                                                                            whileTap={{ scale: 0.98 }}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                generatePaymentLink(commission.id);
                                                                                            }}
                                                                                            disabled={generatingLinkId === commission.id}
                                                                                            className="flex items-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-6 py-2.5 rounded-lg hover:bg-blue-500/30 transition-all font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                                                                        >
                                                                                            {generatingLinkId === commission.id ? (
                                                                                                <Loader2 size={16} className="animate-spin" />
                                                                                            ) : (
                                                                                                <Check size={16} />
                                                                                            )}
                                                                                            {commission.payment_status === 'reservation_paid'
                                                                                                ? 'Generate Remaining 25% Link'
                                                                                                : 'Generate Deposit Link'}
                                                                                        </motion.button>
                                                                                    </>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                {/* Finished / On Delivery status: Final Payment Link */}
                                                                                <div className="flex flex-col gap-4 w-full">
                                                                                    {commission.final_payment_link_url ? (
                                                                                        <div className="flex flex-col gap-2 w-full max-w-md">
                                                                                            <div className="flex items-center gap-2 text-pink-400 mb-1">
                                                                                                <Check size={16} />
                                                                                                <p className="text-sm font-medium">Final Payment Link Ready</p>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-lg p-2.5">
                                                                                                <p className="text-xs font-mono text-neutral-400 truncate flex-1">{commission.final_payment_link_url}</p>
                                                                                                <button
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        navigator.clipboard.writeText(commission.final_payment_link_url || '');
                                                                                                        showNotification('Final link copied!', 'success');
                                                                                                    }}
                                                                                                    className="p-1.5 hover:bg-foreground/10 rounded transition-colors text-neutral-400 hover:text-foreground"
                                                                                                    title="Copy Link"
                                                                                                >
                                                                                                    <Copy size={14} />
                                                                                                </button>
                                                                                                <a
                                                                                                    href={commission.final_payment_link_url}
                                                                                                    target="_blank"
                                                                                                    rel="noreferrer"
                                                                                                    onClick={e => e.stopPropagation()}
                                                                                                    className="p-1.5 hover:bg-foreground/10 rounded transition-colors text-neutral-400 hover:text-foreground"
                                                                                                    title="Open Link"
                                                                                                >
                                                                                                    <ExternalLink size={14} />
                                                                                                </a>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex items-center justify-between gap-6">
                                                                                            <div className="flex flex-col gap-1">
                                                                                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Shipping Cost (₹)</label>
                                                                                                <input
                                                                                                    type="number"
                                                                                                    placeholder="Ex: 150"
                                                                                                    value={shippingCosts[commission.id] || ''}
                                                                                                    onChange={(e) => setShippingCosts(prev => ({ ...prev, [commission.id]: e.target.value }))}
                                                                                                    className="bg-foreground/5 border border-foreground/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50 w-32"
                                                                                                    onClick={e => e.stopPropagation()}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="flex-1 flex justify-end">
                                                                                                <motion.button
                                                                                                    whileHover={{ scale: 1.02 }}
                                                                                                    whileTap={{ scale: 0.98 }}
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        generateFinalPaymentLink(commission.id);
                                                                                                    }}
                                                                                                    disabled={generatingLinkId === commission.id}
                                                                                                    className="flex items-center gap-2 bg-pink-500/20 text-pink-400 border border-pink-500/30 px-6 py-2.5 rounded-lg hover:bg-pink-500/30 transition-all font-bold text-sm shadow-[0_0_15px_rgba(236,72,153,0.1)]"
                                                                                                >
                                                                                                    {generatingLinkId === commission.id ? (
                                                                                                        <Loader2 size={16} className="animate-spin" />
                                                                                                    ) : (
                                                                                                        <Package size={16} />
                                                                                                    )}
                                                                                                    Generate Final Payment Link
                                                                                                </motion.button>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence >
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {commissions.map((commission, index) => (
                                <div key={commission.id} className="bg-surface hover:bg-surface\/80 border border-foreground/10 rounded-lg overflow-hidden">
                                    {/* Card Header - Clickable */}
                                    <div
                                        className="p-6 space-y-4 relative cursor-pointer"
                                        onClick={() => toggleExpand(commission.id)}
                                    >
                                        <div className="absolute top-4 right-4 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => initiateDelete(commission.id)}
                                                disabled={deletingId === commission.id}
                                                className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                                            >
                                                {deletingId === commission.id ? (
                                                    <Loader2 className="animate-spin" size={18} />
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="bg-foreground/10 text-foreground font-mono text-xs px-2 py-0.5 rounded">#{index + 1}</span>
                                                <div className="text-foreground font-medium text-lg">{commission.client_name}</div>
                                                <ChevronDown size={14} className={`text-neutral-500 ml-auto transition-transform duration-200 ${expandedId === commission.id ? 'rotate-180' : ''}`} />
                                            </div>
                                            <div className="text-neutral-400 text-sm">{commission.client_email}</div>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-t border-foreground/5">
                                            <span className="text-neutral-500 text-sm">Referral:</span>
                                            {commission.referral_code ? (
                                                <span className="text-accent font-mono text-sm">{commission.referral_code}</span>
                                            ) : (
                                                <span className="text-neutral-500 text-sm">Direct</span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-t border-foreground/5" onClick={e => e.stopPropagation()}>
                                            <span className="text-neutral-500 text-sm font-medium uppercase tracking-widest text-[10px]">Status:</span>
                                            <div className="flex items-center gap-2">
                                                <StatusDropdown
                                                    value={commission.status}
                                                    options={STATUS_OPTIONS}
                                                    onChange={(val: string) => {
                                                        updateField(commission.id, val);
                                                    }}
                                                    disabled={updatingId === commission.id}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-t border-foreground/5">
                                            <span className="text-neutral-500 text-sm">Submitted:</span>
                                            <span className="text-neutral-400 text-sm">{new Date(commission.submitted_at).toLocaleDateString('en-GB')}</span>
                                        </div>
                                    </div>

                                    {/* Expandable Detail Panel */}
                                    <AnimatePresence>
                                        {expandedId === commission.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden border-t border-accent/20 bg-accent/5"
                                            >
                                                <div className="p-6 grid grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase">Contact</p>
                                                        <div className="flex items-center gap-2 text-sm text-foreground"><Phone size={12} className="text-neutral-500" />{commission.phone || '—'}</div>
                                                        <div className="flex items-center gap-2 text-sm text-foreground"><Instagram size={12} className="text-neutral-500" />{commission.instagram_id || '—'}</div>
                                                        <div className="flex items-start gap-2 text-sm text-foreground"><MapPin size={12} className="text-neutral-500 mt-0.5" /><span>{commission.address || '—'}</span></div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase">Order</p>
                                                        <div className="text-sm text-foreground">Size: {commission.size}</div>
                                                        <div className="text-sm text-foreground">People: {commission.number_of_people}</div>
                                                        {commission.base_price && (
                                                            <div className="space-y-1 text-sm pt-1">
                                                                <div className="flex justify-between"><span className="text-neutral-500">Base</span><span className="font-mono">₹{commission.base_price}</span></div>
                                                                {(commission as CommissionData & { extras_total?: number }).extras_total ? (
                                                                    <div className="flex justify-between"><span className="text-neutral-500">Add-ons</span><span className="font-mono">₹{(commission as CommissionData & { extras_total?: number }).extras_total}</span></div>
                                                                ) : null}
                                                                <div className="flex justify-between border-t border-foreground/10 pt-1 font-bold"><span className="text-foreground">Total</span><span className="font-mono text-foreground">₹{(commission.base_price || 0) + ((commission as CommissionData & { extras_total?: number }).extras_total || 0)}</span></div>
                                                                {commission.referrer_info && commission.commission_amount ? (
                                                                    <div className="flex justify-between border-t border-foreground/10 pt-1 mt-1"><span className="text-accent">Commission</span><span className="font-mono text-accent">₹{commission.commission_amount}</span></div>
                                                                ) : null}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Commission Specific Actions - Mobile */}
                                                {(commission.status === 'waitlist' || (commission.status === 'accepted' && (commission.payment_status === 'pending' || commission.payment_status === 'reservation_paid')) || (commission.status === 'finished' && commission.payment_status !== 'fully_paid') || commission.status === 'on_delivery') && (
                                                    <div className="px-6 pb-6 space-y-4">
                                                        <div className="pt-4 border-t border-foreground/10">
                                                            {commission.status === 'waitlist' ? (
                                                                <>
                                                                    <div className="flex items-start gap-3 text-amber-400 mb-4 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                                                                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                                                        <p className="text-xs leading-relaxed">Promoting this waitlist entry will notify the client that a slot is ready and request the deposit payment.</p>
                                                                    </div>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.01 }}
                                                                        whileTap={{ scale: 0.99 }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateField(commission.id, 'accepted');
                                                                        }}
                                                                        disabled={updatingId === commission.id}
                                                                        className="flex items-center justify-center gap-2 w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-lg hover:bg-emerald-500/30 transition-all font-bold text-sm"
                                                                    >
                                                                        {updatingId === commission.id ? (
                                                                            <Loader2 size={16} className="animate-spin" />
                                                                        ) : (
                                                                            <Check size={16} />
                                                                        )}
                                                                        Accept Waitlist Slot
                                                                    </motion.button>
                                                                </>
                                                            ) : commission.status === 'accepted' ? (
                                                                <>
                                                                    {commission.razorpay_payment_link_url ? (
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center gap-2 text-emerald-400">
                                                                                <Check size={14} />
                                                                                <p className="text-xs font-medium">
                                                                                    {commission.payment_status === 'reservation_paid' ? 'Remaining 25% Link Ready' : 'Deposit Payment Link Ready'}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-lg p-2 overflow-hidden">
                                                                                <p className="text-[10px] font-mono text-neutral-400 truncate flex-1">{commission.razorpay_payment_link_url}</p>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        navigator.clipboard.writeText(commission.razorpay_payment_link_url || '');
                                                                                        showNotification('Link copied!', 'success');
                                                                                    }}
                                                                                    className="p-1.5 hover:bg-foreground/10 rounded transition-colors text-neutral-400"
                                                                                >
                                                                                    <Copy size={14} />
                                                                                </button>
                                                                                <a
                                                                                    href={commission.razorpay_payment_link_url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    onClick={e => e.stopPropagation()}
                                                                                    className="p-1.5 hover:bg-foreground/10 rounded transition-colors text-neutral-400"
                                                                                >
                                                                                    <ExternalLink size={14} />
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <div className="flex items-start gap-3 text-accent mb-4 p-3 rounded-lg border border-accent/10">
                                                                                <p className="text-xs leading-relaxed">
                                                                                    {commission.payment_status === 'reservation_paid' ? 'Remaining 25% pending.' : 'Deposit pending.'} Generate a Razorpay payment link down below.
                                                                                </p>
                                                                            </div>
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.01 }}
                                                                                whileTap={{ scale: 0.99 }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    generatePaymentLink(commission.id);
                                                                                }}
                                                                                disabled={generatingLinkId === commission.id}
                                                                                className="flex items-center justify-center gap-2 w-full bg-blue-500/20 text-blue-400 border border-blue-500/30 px-6 py-3 rounded-lg hover:bg-blue-500/30 transition-all font-bold text-sm"
                                                                            >
                                                                                {generatingLinkId === commission.id ? (
                                                                                    <Loader2 size={16} className="animate-spin" />
                                                                                ) : (
                                                                                    <Check size={16} />
                                                                                )}
                                                                                {commission.payment_status === 'reservation_paid' ? 'Generate Remaining 25% Link' : 'Generate Deposit Link'}
                                                                            </motion.button>
                                                                        </>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    {commission.final_payment_link_url ? (
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center gap-2 text-pink-400">
                                                                                <Check size={14} />
                                                                                <p className="text-xs font-medium">Final Payment Link Ready</p>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-lg p-2 overflow-hidden">
                                                                                <p className="text-[10px] font-mono text-neutral-400 truncate flex-1">{commission.final_payment_link_url}</p>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        navigator.clipboard.writeText(commission.final_payment_link_url || '');
                                                                                        showNotification('Final link copied!', 'success');
                                                                                    }}
                                                                                    className="p-1.5 hover:bg-foreground/10 rounded transition-colors text-neutral-400"
                                                                                >
                                                                                    <Copy size={14} />
                                                                                </button>
                                                                                <a
                                                                                    href={commission.final_payment_link_url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    onClick={e => e.stopPropagation()}
                                                                                    className="p-1.5 hover:bg-foreground/10 rounded transition-colors text-neutral-400"
                                                                                >
                                                                                    <ExternalLink size={14} />
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col gap-4">
                                                                            <div className="flex flex-col gap-1.5">
                                                                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Shipping Cost (₹)</label>
                                                                                <input
                                                                                    type="number"
                                                                                    placeholder="DTDC Quote"
                                                                                    value={shippingCosts[commission.id] || ''}
                                                                                    onChange={(e) => setShippingCosts(prev => ({ ...prev, [commission.id]: e.target.value }))}
                                                                                    className="bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 w-full"
                                                                                    onClick={e => e.stopPropagation()}
                                                                                />
                                                                            </div>
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.01 }}
                                                                                whileTap={{ scale: 0.99 }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    generateFinalPaymentLink(commission.id);
                                                                                }}
                                                                                disabled={generatingLinkId === commission.id}
                                                                                className="flex items-center justify-center gap-2 w-full bg-pink-500/20 text-pink-400 border border-pink-500/30 px-6 py-4 rounded-xl hover:bg-pink-500/30 transition-all font-bold text-sm shadow-[0_0_15px_rgba(236,72,153,0.1)]"
                                                                            >
                                                                                {generatingLinkId === commission.id ? (
                                                                                    <Loader2 size={16} className="animate-spin" />
                                                                                ) : (
                                                                                    <Package size={16} />
                                                                                )}
                                                                                Generate Final Payment Link
                                                                            </motion.button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {commissionToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                        onClick={() => setCommissionToDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface border border-foreground/10 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden"
                        >
                            {/* Decorative background gradient */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative">
                                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                                    <AlertTriangle size={24} />
                                </div>

                                <h3 className="text-xl font-serif text-foreground mb-2">Delete Commission</h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    Are you sure you want to delete this commission? This action cannot be undone and all associated data will be permanently removed.
                                </p>
                            </div>

                            <div className="flex flex-col-reverse md:flex-row gap-3 justify-end relative">
                                <button
                                    onClick={() => setCommissionToDelete(null)}
                                    className="px-5 py-2.5 rounded-lg font-medium text-sm text-neutral-300 hover:text-foreground hover:bg-foreground/5 transition-colors border border-transparent md:w-auto w-full"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-5 py-2.5 rounded-lg font-medium text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center justify-center gap-2 md:w-auto w-full"
                                >
                                    Delete Commission
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Toast Notification */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-8 right-8 z-[100]"
                    >
                        <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${notification.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                            {notification.type === 'success' ? <Check className="shrink-0" size={20} /> : <AlertTriangle className="shrink-0" size={20} />}
                            <p className="font-medium text-sm">{notification.message}</p>
                            <button
                                onClick={() => setNotification(null)}
                                className="p-1 hover:bg-foreground/10 rounded-full transition-colors ml-4"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
