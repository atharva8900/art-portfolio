'use client';

import { useState, useEffect } from 'react';
import { ADMIN_EMAILS } from '@/lib/config/constants';
import Image from 'next/image';
import {
    Loader2, Trash2, Lock, RefreshCcw, Check, X, AlertTriangle, ChevronDown,
    Phone, Instagram, MapPin, User, Package, Calendar, Copy, ExternalLink, ImagePlus,
    Clock, CheckCircle, MoreVertical, ShieldOff, Ban, ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import StatusDropdown from '@/components/admin/StatusDropdown';
import AdminNav from '@/components/admin/AdminNav';
import ConfirmationModal from '@/components/ui/ConfirmationModal';


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
    status: 'pending' | 'accepted' | 'in_progress' | 'finished' | 'on_delivery' | 'completed' | 'rejected' | 'waitlist' | 'cancelled' | 'muted' | 'banned';
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
    wip_images?: string[];
    promo_id?: string | null;
    promotion_code?: string | null;
    discount_percent?: number | null;
    is_self_referral_flag?: boolean;
    flag_reason?: string | null;
    fingerprint_hash?: string | null;
    submitter_email?: string | null;
}

const ALLOWED_EMAILS = ADMIN_EMAILS;

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
    { value: 'muted', label: 'Muted', colorClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { value: 'banned', label: 'Banned', colorClass: 'bg-red-500/20 text-red-500 border-red-500/30' },
];

const PAYMENT_STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', colorClass: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
    { value: 'reservation_paid', label: 'Reservation Paid (25%)', colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { value: 'deposit_paid', label: 'Deposit Paid (50%)', colorClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { value: 'fully_paid', label: 'Fully Paid (100%)', colorClass: 'bg-green-500/20 text-green-400 border-green-500/30' },
];


export default function AdminCommissionsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [commissions, setCommissions] = useState<CommissionData[]>([]);
    const [activeTab, setActiveTab] = useState<'active' | 'history' | 'bans'>('active');
    const [loading, setLoading] = useState(true);
    
    // Bans specific state
    interface BanRecord {
        id: string;
        fingerprint_hash: string;
        client_email?: string | null;
        user_email?: string | null;
        status: 'muted' | 'banned';
        reason: string | null;
        expires_at: string | null;
        created_at: string;
    }
    const [bans, setBans] = useState<BanRecord[]>([]);
    const [deletingHash, setDeletingHash] = useState<string | null>(null);
    const [quickBanLoading, setQuickBanLoading] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [generatingLinkId, setGeneratingLinkId] = useState<string | null>(null);
    const [removingReferralId, setRemovingReferralId] = useState<string | null>(null);
    const [commissionToDelete, setCommissionToDelete] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [shippingCosts, setShippingCosts] = useState<Record<string, string>>({});
    const [wipUploading, setWipUploading] = useState<Record<string, boolean>>({});
    const [wipDeleting, setWipDeleting] = useState<Record<string, boolean>>({});
    const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string; status: string } | null>(null);
    const [paymentStatusToChange, setPaymentStatusToChange] = useState<{ id: string; status: string; clientName: string } | null>(null);
    const [restrictionToConfirm, setRestrictionToConfirm] = useState<{
        type: 'muted' | 'banned';
        fingerprint: string;
        email: string | null | undefined;
        commissionId: string;
        clientName: string;
    } | null>(null);
    const [muteDuration, setMuteDuration] = useState<number>(24 * 60 * 60 * 1000); // Default 24h
    const [isBanConfirmed, setIsBanConfirmed] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [linkToGenerate, setLinkToGenerate] = useState<{ id: string; type: 'deposit' | 'final'; clientName: string } | null>(null);
    const [liftRestrictionHash, setLiftRestrictionHash] = useState<string | null>(null);
    const [liftRestrictionEmail, setLiftRestrictionEmail] = useState<string | null>(null);
    const [liftRestrictionCommissionId, setLiftRestrictionCommissionId] = useState<string | null>(null);


    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    // Auth Logic
    const userEmail = session?.user?.email;
    const isAuthorized = !!session && !!userEmail && ALLOWED_EMAILS.includes(userEmail.toLowerCase());

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingDateId, setEditingDateId] = useState<string | null>(null);
    const [editingDateValue, setEditingDateValue] = useState<string>('');
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [editingNameValue, setEditingNameValue] = useState<string>('');

    const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

    useEffect(() => {
        if (isAuthorized) {
            fetchCommissions();
            if (activeTab === 'bans') {
                fetchBans();
            }
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthorized, status, activeTab]);

    // Click away listener for quick-action menu
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        if (openMenuId) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [openMenuId]);

    const fetchBans = async () => {
        try {
            const res = await fetch('/api/admin/bans');
            if (!res.ok) throw new Error('Failed to fetch bans');
            const data = await res.json();
            setBans(data.bans || []);
            cleanupExpiredMutes(data.bans || []);
        } catch (err: unknown) {
            console.error('Error fetching bans:', err);
        }
    };

    const handleQuickBan = (fingerprintHash: string, userEmail: string | null | undefined, commissionId: string, status: 'muted' | 'banned', clientName: string) => {
        if (!fingerprintHash) {
            showNotification('No fingerprint found for this commission', 'error');
            return;
        }

        setMuteDuration(24 * 60 * 60 * 1000);
        setIsBanConfirmed(false);
        setRestrictionToConfirm({
            type: status,
            fingerprint: fingerprintHash,
            email: userEmail,
            commissionId,
            clientName
        });
    };

    const confirmRestriction = async () => {
        if (!restrictionToConfirm) return;
        
        const { type, fingerprint, email, commissionId } = restrictionToConfirm;

        if (type === 'banned' && !isBanConfirmed) {
            showNotification('Please confirm the permanent ban', 'error');
            return;
        }

        setQuickBanLoading(commissionId);
        setRestrictionToConfirm(null);

        try {
            const res = await fetch('/api/admin/bans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fingerprint_hash: fingerprint,
                    user_email: email,
                    status: type,
                    reason: `Banned via commission ${commissionId}`,
                    duration_ms: type === 'muted' ? muteDuration : null,
                    commission_id: commissionId
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to apply restriction');
            }

            showNotification(`Device ${type === 'muted' ? 'muted' : 'banned'} successfully`, 'success');
            fetchCommissions();
            fetchBans();
        } catch (err: unknown) {
            showNotification((err as Error).message, 'error');
        } finally {
            setQuickBanLoading(null);
            setOpenMenuId(null);
        }
    };

    const cleanupExpiredMutes = async (activeBans: BanRecord[]) => {
        const now = new Date();
        const expired = activeBans.filter(b => b.status === 'muted' && b.expires_at && new Date(b.expires_at) < now);
        
        for (const ban of expired) {
            try {
                // The DELETE endpoint already handles commission status update and email notification
                await fetch(`/api/admin/bans?hash=${ban.fingerprint_hash}`, { method: 'DELETE' });
            } catch (err) {
                console.error('Failed to cleanup expired mute:', err);
            }
        }
        
        if (expired.length > 0) {
            fetchCommissions(); // Refresh to move them to history
        }
    };

    const handleLiftRestriction = (hash: string, email?: string, commissionId?: string) => {
        setLiftRestrictionHash(hash);
        setLiftRestrictionEmail(email || null);
        setLiftRestrictionCommissionId(commissionId || null);
    };

    const confirmLiftRestriction = async () => {
        if (!liftRestrictionHash) return;
        const hash = liftRestrictionHash;
        const email = liftRestrictionEmail;
        const commissionId = liftRestrictionCommissionId;
        setLiftRestrictionHash(null);
        setLiftRestrictionEmail(null);
        setLiftRestrictionCommissionId(null);
        setDeletingHash(hash || email || commissionId || 'unknown');
        try {
            const params = new URLSearchParams();
            if (hash) params.append('hash', hash);
            if (email) params.append('email', email);
            if (commissionId) params.append('commissionId', commissionId);

            const res = await fetch(`/api/admin/bans?${params.toString()}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete ban');
            showNotification('Restriction lifted successfully', 'success');
            fetchBans();
            fetchCommissions();
        } catch (err: unknown) {
            showNotification((err as Error).message, 'error');
        } finally {
            setDeletingHash(null);
        }
    };

    const fetchCommissions = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/admin/commissions?t=${Date.now()}`);

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

    const confirmUpdatePaymentStatus = async () => {
        if (!paymentStatusToChange) return;

        const commissionId = paymentStatusToChange.id;
        const value = paymentStatusToChange.status;

        setPaymentStatusToChange(null);
        setUpdatingId(commissionId);

        try {
            const body = { id: commissionId, payment_status: value };

            const res = await fetch('/api/admin/commissions', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to update payment status');
            } else {
                const data = await res.json();
                setCommissions(prev => prev.map(c =>
                    c.id === commissionId ? data.commission : c
                ));
                showNotification('Payment status updated successfully', 'success');
            }

        } catch (error: unknown) {
            const err = error as { message?: string };
            showNotification(err.message || 'Failed to update payment status', 'error');
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

    const confirmGenerateLink = async () => {
        if (!linkToGenerate) return;

        const { id, type } = linkToGenerate;
        setLinkToGenerate(null); // Close modal

        if (type === 'deposit') {
            await generatePaymentLink(id);
        } else if (type === 'final') {
            await generateFinalPaymentLink(id);
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

    const handleRemoveReferral = async (commissionId: string) => {
        if (!confirm('Are you sure you want to disconnect this referral? The referrer will no longer be eligible for commission on this order.')) {
            return;
        }

        setRemovingReferralId(commissionId);

        try {
            const res = await fetch(`/api/admin/commissions/${commissionId}/remove-referral`, {
                method: 'POST'
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to remove referral');
            }

            const data = await res.json();

            // Update the local state to reflect the change immediately
            setCommissions(prev => prev.map(c =>
                c.id === commissionId ? data.commission : c
            ));

            showNotification('Referrer disconnected successfully', 'success');

        } catch (error: unknown) {
            const err = error as { message?: string };
            showNotification(err.message || 'Failed to remove referral', 'error');
        } finally {
            setRemovingReferralId(null);
        }
    };

    const WIP_SLOTS = [
        { key: 'start', label: 'Start', desc: 'Outline phase' },
        { key: 'mid', label: 'Mid', desc: 'Shading & details' },
        { key: 'finished', label: 'Finished', desc: 'Final artwork' },
    ] as const;
    type WipSlotKey = 'start' | 'mid' | 'finished';

    const getWipImages = (commission: CommissionData): Record<WipSlotKey, string | null> => {
        const images = commission.wip_images ?? [];
        return {
            start: images[0] ?? null,
            mid: images[1] ?? null,
            finished: images[2] ?? null,
        };
    };

    const handleWipUpload = async (commissionId: string, slot: WipSlotKey, file: File) => {
        const key = `${commissionId}-${slot}`;
        setWipUploading(prev => ({ ...prev, [key]: true }));
        const formData = new FormData();
        formData.append('file', file);
        formData.append('slot', slot);
        try {
            const res = await fetch(`/api/admin/commissions/${commissionId}/wip`, { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            showNotification(`WIP '${slot}' image uploaded!`, 'success');
            fetchCommissions();
        } catch {
            showNotification('Upload failed', 'error');
        } finally {
            setWipUploading(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleWipDelete = async (commissionId: string, slot: WipSlotKey) => {
        const key = `${commissionId}-${slot}`;
        setWipDeleting(prev => ({ ...prev, [key]: true }));
        try {
            const res = await fetch(`/api/admin/commissions/${commissionId}/wip?slot=${slot}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            showNotification(`WIP '${slot}' image removed`, 'success');
            fetchCommissions();
        } catch {
            showNotification('Delete failed', 'error');
        } finally {
            setWipDeleting(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

    const ACTIVE_STATUSES = ['pending', 'waitlist', 'accepted', 'in_progress', 'finished', 'on_delivery'];
    const HISTORY_STATUSES = ['completed', 'cancelled', 'rejected'];
    const BANNED_STATUSES = ['muted', 'banned'];

    const activeCommissions = commissions.filter(c => ACTIVE_STATUSES.includes(c.status));
    const historyCommissions = commissions.filter(c => HISTORY_STATUSES.includes(c.status));
    const bannedCommissions = commissions.filter(c => BANNED_STATUSES.includes(c.status));

    const displayedCommissions = activeTab === 'active' 
        ? activeCommissions 
        : activeTab === 'history' 
            ? historyCommissions 
            : bannedCommissions;



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
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-background/30 backdrop-blur-md p-8 rounded-2xl border border-foreground/5 shadow-2xl">
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

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-foreground/5 border border-foreground/10 rounded-xl p-1 w-fit mb-8">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'active'
                            ? 'bg-foreground text-background shadow'
                            : 'text-neutral-500 hover:text-foreground'
                            }`}
                    >
                        <Clock size={15} />
                        Active
                        {activeCommissions.length > 0 && (
                            <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab === 'active' ? 'bg-background/20 text-background' : 'bg-foreground/10 text-foreground/50'
                                }`}>
                                {activeCommissions.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'history'
                            ? 'bg-foreground text-background shadow'
                            : 'text-neutral-400 hover:text-foreground'
                            }`}
                    >
                        <CheckCircle size={15} />
                        History
                        {historyCommissions.length > 0 && (
                            <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab === 'history' ? 'bg-background/20 text-background' : 'bg-foreground/10 text-foreground/50'
                                }`}>
                                {historyCommissions.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('bans')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'bans'
                            ? 'bg-foreground text-background shadow'
                            : 'text-neutral-400 hover:text-foreground'
                            }`}
                    >
                        <ShieldOff size={15} />
                        Bans
                        {bans.length > 0 && (
                            <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab === 'bans' ? 'bg-background/20 text-background' : 'bg-foreground/10 text-foreground/50'
                                }`}>
                                {bans.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Empty State / Loading / Content */}
                {!loading && !error && displayedCommissions.length === 0 && (
                    <div className="text-center py-20 bg-foreground/5 rounded-2xl border border-dashed border-foreground/10">
                        <AlertTriangle size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-neutral-500 font-medium tracking-wide">No {activeTab} commissions found.</p>
                    </div>
                )}

                {/* Commissions Content */}
                <div className="relative">
                        {loading && commissions.length === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="animate-spin text-accent" size={32} />
                            </div>
                        ) : displayedCommissions.length > 0 ? (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-visible">
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
                                    {displayedCommissions.map((commission, index) => (
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
                                                            <div className="text-foreground flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                                {editingNameId === commission.id ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <input 
                                                                            type="text" 
                                                                            value={editingNameValue}
                                                                            onChange={(e) => setEditingNameValue(e.target.value)}
                                                                            className="bg-surface border border-foreground/20 rounded px-2 py-1 text-sm text-foreground outline-none focus:border-accent w-[150px]"
                                                                            autoFocus
                                                                        />
                                                                        <button 
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                if (!editingNameValue.trim()) return;
                                                                                setUpdatingId(commission.id);
                                                                                try {
                                                                                    const res = await fetch('/api/admin/commissions', {
                                                                                        method: 'PATCH',
                                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                        body: JSON.stringify({ id: commission.id, client_name: editingNameValue.trim() }),
                                                                                    });
                                                                                    if (res.ok) {
                                                                                        setCommissions(prev => prev.map(c => c.id === commission.id ? { ...c, client_name: editingNameValue.trim() } : c));
                                                                                        showNotification('Client name updated!');
                                                                                    } else {
                                                                                        showNotification('Failed to update name', 'error');
                                                                                    }
                                                                                } catch {
                                                                                    showNotification('Error updating name', 'error');
                                                                                } finally {
                                                                                    setUpdatingId(null);
                                                                                    setEditingNameId(null);
                                                                                }
                                                                            }}
                                                                            disabled={updatingId === commission.id || !editingNameValue.trim()}
                                                                            className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors disabled:opacity-50"
                                                                        >
                                                                            <Check size={14} />
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingNameId(null);
                                                                            }}
                                                                            className="p-1 hover:bg-neutral-500/20 text-neutral-400 rounded transition-colors"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span 
                                                                        className="cursor-pointer hover:text-accent transition-colors border-b border-transparent hover:border-accent border-dashed"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingNameId(commission.id);
                                                                            setEditingNameValue(commission.client_name);
                                                                        }}
                                                                    >
                                                                        {commission.client_name}
                                                                    </span>
                                                                )}
                                                                {commission.status === 'banned' && (
                                                                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                                                                        <Ban size={10} /> BANNED
                                                                    </span>
                                                                )}
                                                                {commission.status === 'muted' && (
                                                                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                                                                        <Clock size={10} /> MUTED
                                                                        {bans.find(b => b.fingerprint_hash === commission.fingerprint_hash)?.expires_at && (
                                                                            <span className="text-orange-400/60 font-medium lowercase">
                                                                                (untill {new Date(bans.find(b => b.fingerprint_hash === commission.fingerprint_hash)!.expires_at!).toLocaleDateString('en-GB')})
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-neutral-500 text-xs">{commission.client_email}</div>
                                                        </div>
                                                        <ChevronDown size={14} className={`text-neutral-500 ml-1 transition-transform duration-200 ${expandedId === commission.id ? 'rotate-180' : ''}`} />
                                                    </div>
                                                    {commission.is_self_referral_flag && (
                                                        <div className="space-y-1 mt-1.5">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded w-fit">
                                                                <AlertTriangle size={10} />
                                                                POTENTIAL SELF-REFERRAL
                                                            </div>
                                                            {commission.flag_reason && (
                                                                <div className="text-[10px] text-neutral-500 italic max-w-[200px] leading-tight">
                                                                    {commission.flag_reason}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
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
                                                                setPendingStatusChange({ id: commission.id, status: val });
                                                            }}
                                                            disabled={updatingId === commission.id}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-neutral-400 text-sm group" onClick={e => e.stopPropagation()}>
                                                    {editingDateId === commission.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="datetime-local" 
                                                                value={editingDateValue}
                                                                onChange={(e) => setEditingDateValue(e.target.value)}
                                                                className="bg-surface border border-foreground/20 rounded p-1 text-xs text-foreground outline-none focus:border-accent"
                                                            />
                                                            <button 
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    setUpdatingId(commission.id);
                                                                    try {
                                                                        const res = await fetch('/api/admin/commissions', {
                                                                            method: 'PATCH',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ id: commission.id, submitted_at: new Date(editingDateValue).toISOString() }),
                                                                        });
                                                                        if (res.ok) {
                                                                            setCommissions(prev => prev.map(c => c.id === commission.id ? { ...c, submitted_at: new Date(editingDateValue).toISOString() } : c));
                                                                            showNotification('Submission date updated!');
                                                                        } else {
                                                                            showNotification('Failed to update date', 'error');
                                                                        }
                                                                    } catch {
                                                                        showNotification('Error updating date', 'error');
                                                                    } finally {
                                                                        setUpdatingId(null);
                                                                        setEditingDateId(null);
                                                                    }
                                                                }}
                                                                disabled={updatingId === commission.id}
                                                                className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingDateId(null);
                                                                }}
                                                                className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div 
                                                            className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors group-hover:bg-foreground/5 p-1 -ml-1 rounded"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Convert to local datetime string format for the input
                                                                const d = new Date(commission.submitted_at);
                                                                const pad = (n: number) => n.toString().padStart(2, '0');
                                                                const dtStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                                                setEditingDateValue(dtStr);
                                                                setEditingDateId(commission.id);
                                                            }}
                                                            title="Click to edit date"
                                                        >
                                                            <span>{new Date(commission.submitted_at).toLocaleDateString('en-GB')}</span>
                                                            <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <RefreshCcw size={12} className="text-neutral-500" />
                                                            </motion.div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-right" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Quick Mute/Ban Menu */}
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    setOpenMenuId(openMenuId === commission.id ? null : commission.id);
                                                                }}
                                                                className="p-2 text-neutral-500 hover:text-foreground hover:bg-foreground/5 rounded transition-colors relative z-10"
                                                                title="Quick Actions"
                                                            >
                                                                <MoreVertical size={18} />
                                                            </button>
                                                            
                                                            <AnimatePresence>
                                                                {openMenuId === commission.id && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                        className="absolute right-0 mt-2 w-48 bg-surface border border-foreground/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                                                    >
                                                                        <div className="p-1.5 space-y-1">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (activeTab === 'bans') {
                                                                                        const ban = bans.find(b => 
                                                                                            (b.fingerprint_hash && b.fingerprint_hash === commission.fingerprint_hash) || 
                                                                                            (b.user_email && (b.user_email === commission.submitter_email || b.user_email === commission.client_email))
                                                                                        );
                                                                                        handleLiftRestriction(ban?.fingerprint_hash || commission.fingerprint_hash || '', commission.submitter_email || commission.client_email, commission.id);
                                                                                    } else {
                                                                                        handleQuickBan(commission.fingerprint_hash || '', commission.submitter_email || commission.client_email, commission.id, 'muted', commission.client_name);
                                                                                    }
                                                                                    setOpenMenuId(null);
                                                                                }}
                                                                                disabled={quickBanLoading === commission.id || (activeTab === 'bans' && deletingHash === commission.fingerprint_hash)}
                                                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors text-left"
                                                                            >
                                                                                {activeTab === 'bans' ? <Check size={14} /> : <Clock size={14} />}
                                                                                {activeTab === 'bans' ? 'Lift Restriction' : 'Mute User'}
                                                                            </button>
                                                                            {activeTab !== 'bans' && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleQuickBan(commission.fingerprint_hash || '', commission.submitter_email || commission.client_email, commission.id, 'banned', commission.client_name);
                                                                                        setOpenMenuId(null);
                                                                                    }}
                                                                                    disabled={quickBanLoading === commission.id}
                                                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors font-bold text-left border-b border-foreground/5 pb-2"
                                                                                >
                                                                                    <Ban size={14} />
                                                                                    Ban Device (Perm)
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={() => {
                                                                                    setOpenMenuId(null);
                                                                                    initiateDelete(commission.id);
                                                                                }}
                                                                                disabled={deletingId === commission.id}
                                                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-left pt-2"
                                                                            >
                                                                                 {deletingId === commission.id ? (
                                                                                    <Loader2 className="animate-spin" size={14} />
                                                                                ) : (
                                                                                    <Trash2 size={14} />
                                                                                )}
                                                                                Delete Commission
                                                                            </button>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
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

                                                                                {commission.discount_percent ? (
                                                                                    <>
                                                                                        <div className="flex justify-between gap-4 border-t border-foreground/10 pt-1 mt-1 font-medium">
                                                                                            <span className="text-neutral-500">Original Total</span>
                                                                                            <span className="font-mono text-neutral-500 line-through">₹{Math.round((commission.base_price || 0) / (1 - (commission.discount_percent || 0) / 100) + ((commission as CommissionData & { extras_total?: number }).extras_total || 0))}</span>
                                                                                        </div>
                                                                                        <div className="flex justify-between gap-4 text-emerald-400 text-xs">
                                                                                            <span className="font-medium">Offer Savings ({commission.promotion_code})</span>
                                                                                            <span className="font-mono">-₹{Math.round(((commission.base_price || 0) / (1 - (commission.discount_percent || 0) / 100)) * ((commission.discount_percent || 0) / 100))}</span>
                                                                                        </div>
                                                                                    </>
                                                                                ) : null}

                                                                                <div className="flex justify-between gap-4 border-t border-foreground/10 pt-1 mt-1"><span className="text-foreground font-medium">Final Artwork Total</span><span className="font-mono text-foreground font-bold text-lg">₹{(commission.base_price || 0) + ((commission as CommissionData & { extras_total?: number }).extras_total || 0)}</span></div>
                                                                                {commission.shipping_cost ? (
                                                                                    <div className="flex justify-between gap-4 text-pink-400 font-medium italic"><span className="">Shipping</span><span className="font-mono">₹{commission.shipping_cost}</span></div>
                                                                                ) : null}
                                                                            </div>
                                                                        ) : <span className="text-neutral-600 text-sm">—</span>}

                                                                        <div className="pt-4 border-t border-foreground/10">
                                                                            <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase mb-2">Payment Status (Manual Override)</p>
                                                                            <div className="flex items-center gap-2">
                                                                                <StatusDropdown
                                                                                    value={commission.payment_status || 'pending'}
                                                                                    options={PAYMENT_STATUS_OPTIONS}
                                                                                    onChange={(val: string) => setPaymentStatusToChange({ id: commission.id, status: val, clientName: commission.client_name })}
                                                                                    disabled={updatingId === commission.id}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {commission.referrer_info && (
                                                                            <div className="mt-3 pt-3 border-t border-foreground/10">
                                                                                <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase mb-2">Referrer</p>
                                                                                <p className="text-sm text-foreground">{commission.referrer_info.name}</p>
                                                                                <p className="text-xs text-neutral-500">{commission.referrer_info.email}</p>
                                                                                {commission.commission_amount ? (
                                                                                    <div className="flex justify-between gap-4 mt-2 pt-2 border-t border-foreground/10 mb-3">
                                                                                        <span className="text-neutral-400 text-sm">Commission</span>
                                                                                        <span className="font-mono text-accent font-bold text-sm">₹{commission.commission_amount}</span>
                                                                                    </div>
                                                                                ) : null}

                                                                                {commission.is_self_referral_flag && (
                                                                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg space-y-1 mt-2">
                                                                                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                                            <AlertTriangle size={12} />
                                                                                            Self-Referral Flagged
                                                                                        </p>
                                                                                        <p className="text-xs text-neutral-400 italic">
                                                                                            {commission.flag_reason || 'Unknown reason'}
                                                                                        </p>
                                                                                    </div>
                                                                                )}

                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleRemoveReferral(commission.id);
                                                                                    }}
                                                                                    disabled={removingReferralId === commission.id}
                                                                                    className="flex items-center gap-1.5 text-xs text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-2.5 py-1.5 rounded transition-colors mt-2 disabled:opacity-50"
                                                                                >
                                                                                    {removingReferralId === commission.id ? (
                                                                                        <Loader2 size={12} className="animate-spin" />
                                                                                    ) : (
                                                                                        <X size={12} />
                                                                                    )}
                                                                                    Disconnect Referrer
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* WIP Gallery & Actions Section */}
                                                                <div className="border-t border-foreground/10 flex flex-col xl:flex-row gap-8 -mx-6 px-6 pt-6 pb-2 mt-2">
                                                                    {/* WIP Gallery Section */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase mb-4">WIP Gallery</p>
                                                                        <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                                                                            {WIP_SLOTS.map(slot => {
                                                                                const images = getWipImages(commission);
                                                                                const imgUrl = images[slot.key];
                                                                                const uploading = wipUploading[`${commission.id}-${slot.key}`];
                                                                                const deleting = wipDeleting[`${commission.id}-${slot.key}`];
                                                                                return (
                                                                                    <div key={slot.key} className="flex flex-col gap-2 shrink-0">
                                                                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{slot.label}</p>
                                                                                        <p className="text-[10px] text-neutral-600 truncate max-w-[120px]">{slot.desc}</p>
                                                                                        {imgUrl ? (
                                                                                            <div
                                                                                                className="relative group rounded-lg overflow-hidden border border-foreground/10 w-28 h-28 bg-foreground/5 cursor-pointer"
                                                                                                onClick={(e) => { e.stopPropagation(); setPreviewImage(imgUrl); }}
                                                                                            >
                                                                                                <Image
                                                                                                    src={imgUrl}
                                                                                                    alt={slot.label}
                                                                                                    fill
                                                                                                    className="object-cover"
                                                                                                    sizes="112px"
                                                                                                />
                                                                                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                                    <button
                                                                                                        onClick={e => { e.stopPropagation(); handleWipDelete(commission.id, slot.key); }}
                                                                                                        disabled={deleting}
                                                                                                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full text-foreground hover:bg-red-600 transition-colors"
                                                                                                    >
                                                                                                        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                                                                    </button>
                                                                                                    <span className="text-foreground text-xs pointer-events-none">Click to enlarge</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <label className="flex flex-col items-center justify-center gap-2 w-28 h-28 rounded-lg border-2 border-dashed border-foreground/15 hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer text-neutral-500 hover:text-accent">
                                                                                                {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                                                                                                <span className="text-[10px] font-medium">{uploading ? 'Uploading...' : 'Upload'}</span>
                                                                                                <input
                                                                                                    type="file"
                                                                                                    accept="image/jpeg,image/png,image/webp"
                                                                                                    className="hidden"
                                                                                                    onChange={e => {
                                                                                                        const file = e.target.files?.[0];
                                                                                                        if (file) { e.stopPropagation(); handleWipUpload(commission.id, slot.key, file); }
                                                                                                    }}
                                                                                                    onClick={e => e.stopPropagation()}
                                                                                                    disabled={uploading}
                                                                                                />
                                                                                            </label>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>

                                                                    {/* Commission Specific Actions */}
                                                                    {(commission.status === 'waitlist' || (commission.status === 'accepted' && (commission.payment_status === 'pending' || commission.payment_status === 'reservation_paid')) || (commission.status === 'finished' && commission.payment_status !== 'fully_paid') || commission.status === 'on_delivery') && (
                                                                        <div className="w-full xl:w-96 shrink-0 bg-accent/5 rounded-xl border border-accent/10 p-5 mb-4 flex flex-col justify-center">
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
                                                                                            setPendingStatusChange({ id: commission.id, status: 'accepted' });
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
                                                                                        <div className="flex flex-col md:flex-row xl:flex-col items-start xl:items-stretch md:items-center justify-between gap-4 w-full">
                                                                                            <div className="flex items-start gap-3 text-accent xl:mb-2">
                                                                                                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                                                                                                <p className="text-sm font-medium leading-tight">
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
                                                                                                    setLinkToGenerate({
                                                                                                        id: commission.id,
                                                                                                        type: 'deposit',
                                                                                                        clientName: commission.client_name
                                                                                                    });
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
                                                                                        </div>
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
                                                                                            <div className="flex flex-col md:flex-row xl:flex-col items-start xl:items-stretch md:items-center justify-between gap-4">
                                                                                                <div className="flex flex-col gap-1 w-full">
                                                                                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Shipping Cost (₹)</label>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        placeholder="Ex: 150"
                                                                                                        value={shippingCosts[commission.id] || ''}
                                                                                                        onChange={(e) => setShippingCosts(prev => ({ ...prev, [commission.id]: e.target.value }))}
                                                                                                        className="bg-foreground/5 border border-foreground/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50 w-full md:w-32 xl:w-full"
                                                                                                        onClick={e => e.stopPropagation()}
                                                                                                    />
                                                                                                </div>
                                                                                                <div className="w-full flex justify-start">
                                                                                                    <motion.button
                                                                                                        whileHover={{ scale: 1.02 }}
                                                                                                        whileTap={{ scale: 0.98 }}
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            setLinkToGenerate({
                                                                                                                id: commission.id,
                                                                                                                type: 'final',
                                                                                                                clientName: commission.client_name
                                                                                                            });
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
                                                                </div>
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
                            {displayedCommissions.map((commission, index) => (
                                <div key={commission.id} className="bg-background hover:bg-background/80 border border-foreground/10 rounded-lg overflow-visible">
                                    {/* Card Header - Clickable */}
                                    <div
                                        className="p-5 md:p-6 space-y-4 cursor-pointer"
                                        onClick={() => toggleExpand(commission.id)}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-foreground/10 text-foreground font-mono text-xs px-2 py-0.5 rounded shrink-0">#{index + 1}</span>
                                                <div className="text-foreground font-medium text-base md:text-lg min-w-0 pr-2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                    {editingNameId === commission.id ? (
                                                        <div className="flex items-center gap-2 w-full max-w-full">
                                                            <input 
                                                                type="text" 
                                                                value={editingNameValue}
                                                                onChange={(e) => setEditingNameValue(e.target.value)}
                                                                className="bg-surface border border-foreground/20 rounded px-2 py-1 text-sm text-foreground outline-none focus:border-accent flex-1 min-w-0"
                                                                autoFocus
                                                            />
                                                            <button 
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (!editingNameValue.trim()) return;
                                                                    setUpdatingId(commission.id);
                                                                    try {
                                                                        const res = await fetch('/api/admin/commissions', {
                                                                            method: 'PATCH',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ id: commission.id, client_name: editingNameValue.trim() }),
                                                                        });
                                                                        if (res.ok) {
                                                                            setCommissions(prev => prev.map(c => c.id === commission.id ? { ...c, client_name: editingNameValue.trim() } : c));
                                                                            showNotification('Client name updated!');
                                                                        } else {
                                                                            showNotification('Failed to update name', 'error');
                                                                        }
                                                                    } catch {
                                                                        showNotification('Error updating name', 'error');
                                                                    } finally {
                                                                        setUpdatingId(null);
                                                                        setEditingNameId(null);
                                                                    }
                                                                }}
                                                                disabled={updatingId === commission.id || !editingNameValue.trim()}
                                                                className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors disabled:opacity-50 shrink-0"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingNameId(null);
                                                                }}
                                                                className="p-1.5 hover:bg-neutral-500/20 text-neutral-400 rounded transition-colors shrink-0"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span 
                                                            className="cursor-pointer hover:text-accent transition-colors border-b border-transparent hover:border-accent border-dashed truncate"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingNameId(commission.id);
                                                                setEditingNameValue(commission.client_name);
                                                            }}
                                                        >
                                                            {commission.client_name}
                                                        </span>
                                                    )}
                                                    {commission.status === 'banned' && (
                                                        <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">BAN</span>
                                                    )}
                                                    {commission.status === 'muted' && (
                                                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">MUTE</span>
                                                    )}
                                                </div>
                                                    <div className="flex items-center ml-auto shrink-0 gap-1">
                                                        {/* Quick Action Three Dots for Mobile */}
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    setOpenMenuId(openMenuId === commission.id ? null : commission.id);
                                                                }}
                                                                className="p-1.5 text-neutral-500 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-colors relative z-10"
                                                            >
                                                                <MoreVertical size={16} />
                                                            </button>
                                                            
                                                            <AnimatePresence>
                                                                {openMenuId === commission.id && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95, x: 20 }}
                                                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.95, x: 20 }}
                                                                        className="absolute right-0 mt-2 w-48 bg-surface border border-foreground/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                                                    >
                                                                        <div className="p-1.5 space-y-1">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (activeTab === 'bans') {
                                                                                        const ban = bans.find(b => 
                                                                                            (b.fingerprint_hash && b.fingerprint_hash === commission.fingerprint_hash) || 
                                                                                            (b.user_email && (b.user_email === commission.submitter_email || b.user_email === commission.client_email))
                                                                                        );
                                                                                        handleLiftRestriction(ban?.fingerprint_hash || commission.fingerprint_hash || '', commission.submitter_email || commission.client_email, commission.id);
                                                                                    } else {
                                                                                        handleQuickBan(commission.fingerprint_hash || '', commission.submitter_email || commission.client_email, commission.id, 'muted', commission.client_name);
                                                                                    }
                                                                                    setOpenMenuId(null);
                                                                                }}
                                                                                disabled={quickBanLoading === commission.id || (activeTab === 'bans' && deletingHash === commission.fingerprint_hash)}
                                                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                                                                            >
                                                                                {activeTab === 'bans' ? <Check size={14} /> : <Clock size={14} />}
                                                                                {activeTab === 'bans' ? 'Lift Restriction' : 'Mute User'}
                                                                            </button>
                                                                            {activeTab !== 'bans' && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleQuickBan(commission.fingerprint_hash || '', commission.submitter_email || commission.client_email, commission.id, 'banned', commission.client_name);
                                                                                        setOpenMenuId(null);
                                                                                    }}
                                                                                    disabled={quickBanLoading === commission.id}
                                                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors font-bold border-b border-foreground/5 pb-2"
                                                                                >
                                                                                    <Ban size={14} />
                                                                                    Ban User (Perm)
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setOpenMenuId(null);
                                                                                    initiateDelete(commission.id);
                                                                                }}
                                                                                disabled={deletingId === commission.id}
                                                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors pt-2"
                                                                            >
                                                                                 {deletingId === commission.id ? (
                                                                                    <Loader2 className="animate-spin" size={14} />
                                                                                ) : (
                                                                                    <Trash2 size={14} />
                                                                                )}
                                                                                Delete Commission
                                                                            </button>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>

                                                        <div className="p-1" onClick={(e) => { e.stopPropagation(); toggleExpand(commission.id); }}>
                                                            <ChevronDown size={16} className={`text-neutral-500 transition-transform duration-200 ${expandedId === commission.id ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-neutral-400 text-sm truncate pr-16">{commission.client_email}</div>
                                                {commission.status === 'muted' && (
                                                    <div className="text-[10px] text-orange-400/70 font-medium">
                                                        Mute expires: {bans.find(b => b.fingerprint_hash === commission.fingerprint_hash)?.expires_at 
                                                            ? new Date(bans.find(b => b.fingerprint_hash === commission.fingerprint_hash)!.expires_at!).toLocaleDateString('en-GB') 
                                                            : 'indefinite'}
                                                    </div>
                                                )}
                                            </div>
                                            {commission.is_self_referral_flag && (
                                                <div className="space-y-1 mt-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded w-fit">
                                                        <AlertTriangle size={10} />
                                                        POTENTIAL SELF-REFERRAL
                                                    </div>
                                                    {commission.flag_reason && (
                                                        <div className="text-[10px] text-neutral-500 italic leading-tight">
                                                            {commission.flag_reason}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
                                                        setPendingStatusChange({ id: commission.id, status: val });
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
                                                        <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase">Pricing</p>
                                                        <div className="space-y-1 text-sm pt-1">
                                                            <div className="flex justify-between"><span className="text-neutral-500">Base</span><span className="font-mono">₹{commission.base_price}</span></div>
                                                            {(commission as CommissionData & { extras_total?: number }).extras_total ? (
                                                                <div className="flex justify-between"><span className="text-neutral-500">Add-ons</span><span className="font-mono">₹{(commission as CommissionData & { extras_total?: number }).extras_total}</span></div>
                                                            ) : null}

                                                            {commission.discount_percent ? (
                                                                <>
                                                                    <div className="flex justify-between border-t border-foreground/10 pt-1 mt-1">
                                                                        <span className="text-neutral-500 text-xs">Original Total</span>
                                                                        <span className="font-mono text-neutral-500 line-through text-xs">₹{Math.round((commission.base_price || 0) / (1 - (commission.discount_percent || 0) / 100) + ((commission as CommissionData & { extras_total?: number }).extras_total || 0))}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-emerald-400 text-[10px]">
                                                                        <span className="font-medium">Savings ({commission.promotion_code})</span>
                                                                        <span className="font-mono">-₹{Math.round(((commission.base_price || 0) / (1 - (commission.discount_percent || 0) / 100)) * ((commission.discount_percent || 0) / 100))}</span>
                                                                    </div>
                                                                </>
                                                            ) : null}

                                                            <div className="flex justify-between border-t border-foreground/10 pt-1 font-bold"><span className="text-foreground">Final Total</span><span className="font-mono text-foreground">₹{(commission.base_price || 0) + ((commission as CommissionData & { extras_total?: number }).extras_total || 0)}</span></div>
                                                            {commission.referrer_info && commission.commission_amount ? (
                                                                <>
                                                                    <div className="flex justify-between border-t border-foreground/10 pt-1 mt-1 mb-2"><span className="text-accent">Commission</span><span className="font-mono text-accent">₹{commission.commission_amount}</span></div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRemoveReferral(commission.id);
                                                                        }}
                                                                        disabled={removingReferralId === commission.id}
                                                                        className="w-full flex justify-center items-center gap-1.5 text-xs text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-2.5 py-1.5 rounded transition-colors disabled:opacity-50"
                                                                    >
                                                                        {removingReferralId === commission.id ? (
                                                                            <Loader2 size={12} className="animate-spin" />
                                                                        ) : (
                                                                            <X size={12} />
                                                                        )}
                                                                        Disconnect Referrer
                                                                    </button>
                                                                </>
                                                            ) : null}
                                                        </div>
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
                                                                            setPendingStatusChange({ id: commission.id, status: 'accepted' });
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
                                                                                    setLinkToGenerate({
                                                                                        id: commission.id,
                                                                                        type: 'deposit',
                                                                                        clientName: commission.client_name
                                                                                    });
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
                                                                                    setLinkToGenerate({
                                                                                        id: commission.id,
                                                                                        type: 'final',
                                                                                        clientName: commission.client_name
                                                                                    });
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
                        ) : null}
                </div>
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
                            className="bg-background border border-foreground/10 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden"
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

            {/* Custom Payment Status Confirmation Modal */}
            <AnimatePresence>
                {paymentStatusToChange && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                        onClick={() => setPaymentStatusToChange(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-background border border-foreground/10 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden"
                        >
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative">
                                <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mb-4 border border-purple-500/20">
                                    <AlertTriangle size={24} />
                                </div>

                                <h3 className="text-xl font-serif text-foreground mb-2">Update Payment Status</h3>
                                <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                                    Are you sure you want to manually update the payment status for <strong className="text-foreground">{paymentStatusToChange.clientName}</strong>?
                                </p>
                                <p className="text-neutral-400 text-sm leading-relaxed border-l-2 border-purple-500/50 pl-3">
                                    New Status: <strong className="text-purple-400">{PAYMENT_STATUS_OPTIONS.find(o => o.value === paymentStatusToChange.status)?.label || paymentStatusToChange.status}</strong>
                                </p>
                                <p className="text-neutral-500 text-xs mt-4">
                                    This will immediately affect the balance due on their generated invoice.
                                </p>
                            </div>

                            <div className="flex flex-col-reverse md:flex-row gap-3 justify-end relative">
                                <button
                                    onClick={() => setPaymentStatusToChange(null)}
                                    className="px-5 py-2.5 rounded-lg font-medium text-sm text-neutral-300 hover:text-foreground hover:bg-foreground/5 transition-colors border border-transparent md:w-auto w-full"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmUpdatePaymentStatus}
                                    className="px-5 py-2.5 rounded-lg font-medium text-sm bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-all flex items-center justify-center gap-2 md:w-auto w-full"
                                >
                                    Confirm Update
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Status Change Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!pendingStatusChange}
                onClose={() => setPendingStatusChange(null)}
                onConfirm={() => {
                    if (pendingStatusChange) {
                        updateField(pendingStatusChange.id, pendingStatusChange.status);
                        setPendingStatusChange(null);
                    }
                }}
                title="Update Status?"
                message={`Are you sure you want to change the status to "${STATUS_OPTIONS.find(o => o.value === pendingStatusChange?.status)?.label}"? This may trigger automated emails and notifications.`}
                confirmText="Yes, Update Status"
                cancelText="Cancel"
                variant="primary"
            />

            {/* Custom Mute/Ban Confirmation Modal */}
            <AnimatePresence>
                {restrictionToConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
                        onClick={() => setRestrictionToConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface border border-foreground/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden"
                        >
                            {/* Decorative background gradient */}
                            <div className={`absolute -top-24 -right-24 w-48 h-48 ${restrictionToConfirm.type === 'muted' ? 'bg-orange-500/10' : 'bg-red-500/10'} rounded-full blur-3xl pointer-events-none`} />

                            <div className="relative">
                                <div className={`w-14 h-14 ${restrictionToConfirm.type === 'muted' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} rounded-2xl flex items-center justify-center mb-6 border`}>
                                    {restrictionToConfirm.type === 'muted' ? <Clock size={28} /> : <Ban size={28} />}
                                </div>

                                <h3 className="text-2xl font-serif text-foreground mb-2 flex items-center gap-2">
                                    {restrictionToConfirm.type === 'muted' ? 'Mute' : 'Ban'} Restriction
                                    <span className="text-xs font-sans font-normal text-neutral-500 bg-foreground/5 px-2 py-0.5 rounded-full border border-foreground/10">Admin Tool</span>
                                </h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    You are applying a <strong className="text-foreground capitalize">{restrictionToConfirm.type}</strong> restriction to <strong className="text-accent">{restrictionToConfirm.clientName}</strong>. 
                                    This will {restrictionToConfirm.type === 'muted' ? 'temporarily' : 'permanently'} restrict access for their device and account.
                                </p>
                            </div>

                            {restrictionToConfirm.type === 'muted' ? (
                                <div className="space-y-3 relative">
                                    <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase px-1">Select Duration</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { label: '24 Hours', desc: '1 Day restriction', value: 24 * 60 * 60 * 1000 },
                                            { label: '1 Week', desc: '7 Days restriction', value: 7 * 24 * 60 * 60 * 1000 },
                                            { label: '1 Month', desc: '30 Days restriction', value: 30 * 24 * 60 * 60 * 1000 }
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setMuteDuration(opt.value)}
                                                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                                                    muteDuration === opt.value 
                                                        ? 'bg-orange-500/10 border-orange-500/40' 
                                                        : 'bg-foreground/5 border-foreground/5 hover:border-foreground/10'
                                                }`}
                                            >
                                                <div>
                                                    <p className={`text-sm font-bold ${muteDuration === opt.value ? 'text-orange-400' : 'text-foreground'}`}>{opt.label}</p>
                                                    <p className="text-[10px] text-neutral-500">{opt.desc}</p>
                                                </div>
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${muteDuration === opt.value ? 'border-orange-500' : 'border-neutral-700'}`}>
                                                    {muteDuration === opt.value && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-4">
                                    <p className="text-xs text-red-100/90 leading-relaxed font-medium">
                                        This is a <strong>Permanent Ban</strong>. The user will be unable to submit any future commissions from this device/account unless manually unbanned.
                                    </p>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="pt-0.5">
                                            <input 
                                                type="checkbox" 
                                                checked={isBanConfirmed} 
                                                onChange={(e) => setIsBanConfirmed(e.target.checked)}
                                                className="w-4 h-4 rounded border-red-500/30 bg-red-500/20 text-red-500 focus:ring-red-500/40"
                                            />
                                        </div>
                                        <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">
                                            I understand this is permanent and want to proceed with banning this device.
                                        </span>
                                    </label>
                                </div>
                            )}

                            <div className="flex flex-col-reverse md:flex-row gap-3 justify-end pt-2 relative">
                                <button
                                    onClick={() => setRestrictionToConfirm(null)}
                                    className="px-6 py-3 rounded-xl font-bold text-xs text-neutral-400 hover:text-foreground hover:bg-foreground/5 transition-all md:w-auto w-full uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRestriction}
                                    disabled={quickBanLoading === restrictionToConfirm.commissionId || (restrictionToConfirm.type === 'banned' && !isBanConfirmed)}
                                    className={`px-8 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 md:w-auto w-full uppercase tracking-tighter disabled:opacity-30 disabled:cursor-not-allowed ${
                                        restrictionToConfirm.type === 'muted' 
                                            ? 'bg-orange-500 text-foreground shadow-lg shadow-orange-500/20 hover:bg-orange-600' 
                                            : 'bg-red-500 text-foreground shadow-lg shadow-red-500/20 hover:bg-red-600'
                                    }`}
                                >
                                    {quickBanLoading === restrictionToConfirm.commissionId ? (
                                        <Loader2 className="animate-spin" size={16} />
                                    ) : (
                                        <>
                                            Confirm {restrictionToConfirm.type}
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lift Restriction Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!liftRestrictionHash}
                onClose={() => setLiftRestrictionHash(null)}
                onConfirm={confirmLiftRestriction}
                title="Lift Device Restriction?"
                message="Are you sure you want to lift the restriction for this device and user? They will be allowed to submit new commission requests immediately."
                confirmText="Yes, Lift Restriction"
                cancelText="Cancel"
                variant="primary"
            />

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

            {/* Generate Link Confirmation Modal */}
            <AnimatePresence>
                {linkToGenerate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 p-4"
                        onClick={() => setLinkToGenerate(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-background border border-foreground/10 rounded-xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-xl font-bold mb-2">Generate Payment Link?</h3>
                            <p className="text-sm text-neutral-400 mb-6">
                                You are about to generate a {linkToGenerate.type === 'deposit' ? 'deposit' : 'final'} payment link for <strong className="text-foreground">{linkToGenerate.clientName}</strong>. This will interact with Razorpay.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setLinkToGenerate(null)}
                                    className="flex-1 px-4 py-2 border border-foreground/10 rounded-lg text-sm font-medium hover:bg-foreground/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmGenerateLink}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-foreground rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    Confirm Generate
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fullscreen Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 p-4 md:p-8"
                        onClick={() => setPreviewImage(null)}
                    >
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-foreground/10 hover:bg-foreground/20 rounded-full transition-colors text-foreground"
                        >
                            <X size={24} />
                        </button>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-5xl h-full max-h-[85vh] rounded-lg overflow-hidden"
                        >
                            <Image
                                src={previewImage}
                                alt="Commission WIP Preview"
                                fill
                                className="object-contain"
                                sizes="100vw"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
