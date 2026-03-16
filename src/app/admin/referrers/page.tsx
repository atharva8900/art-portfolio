'use client';

import { useState, useEffect } from 'react';
import {
    Loader2, Copy, Users, Check, Lock, ExternalLink,
    Calendar, Trash2
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AdminNav from '@/components/admin/AdminNav';

interface ReferrerData {
    code: string;
    referrer_name: string;
    referrer_email: string;
    referrer_phone?: string;
    referrer_instagram?: string;
    created_at: string;
    ip_hash: string;
    successful_referrals_count: number;
    used_by_emails: string[];
}

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharva_sherlekar_art@gmail.com'];

export default function AdminReferrersPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [referrers, setReferrers] = useState<ReferrerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [affiliateToDelete, setAffiliateToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    // Auth Logic
    const userEmail = session?.user?.email;
    const isAuthorized = !!session && !!userEmail && ALLOWED_EMAILS.includes(userEmail.toLowerCase());

    useEffect(() => {
        if (isAuthorized) {
            fetchReferrers();
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [isAuthorized, status]);

    const fetchReferrers = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/referrers');

            if (!res.ok) {
                if (res.status === 401) return;
                throw new Error('Failed to fetch referrers');
            }

            const data = await res.json();
            // Sort by newest first
            const sorted = (data.referrers || []).sort((a: ReferrerData, b: ReferrerData) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setReferrers(sorted);
        } catch (error: unknown) {
            const err = error as { message?: string };
            setError(err.message || 'Failed to load referrers');
        } finally {
            setLoading(false);
        }
    };

    const executeDelete = async () => {
        if (!affiliateToDelete) return;
        setIsDeleting(true);

        try {
            const res = await fetch(`/api/admin/referrers/${affiliateToDelete}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete affiliate');

            setReferrers((prev) => prev.filter((r) => r.code !== affiliateToDelete));
            showNotification('Affiliate successfully deleted', 'success');
        } catch {
            showNotification('Failed to delete affiliate', 'error');
        } finally {
            setIsDeleting(false);
            setAffiliateToDelete(null);
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
                <div className="bg-surface border border-foreground/10 p-8 rounded-xl max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <Lock size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif text-foreground mb-2">Unauthorized Access</h1>
                        <p className="text-neutral-400">You do not have permission to view this page.</p>
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
        <div className="min-h-screen bg-background text-foreground px-4 md:px-8 lg:px-12 selection:bg-accent/30 flex flex-col">
            <AdminNav />
            <div className="max-w-7xl mx-auto w-full space-y-10 pt-10 pb-20 mt-16 md:mt-24 flex-1 flex flex-col">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4 shrink-0">
                    <div>
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-accent text-[10px] uppercase tracking-[0.3em] font-bold mb-2 block"
                        >
                            Referral Network
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-serif tracking-wide"
                        >
                            All Affiliates
                        </motion.h1>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
                        <div className="bg-surface border border-foreground/5 rounded-2xl px-6 py-3 flex items-center justify-between gap-6 shadow-xl">
                            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                                Total Links
                            </span>
                            <span className="font-cinzel text-xl text-foreground">
                                {referrers.length}
                            </span>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl shrink-0">
                        {error}
                    </div>
                ) : loading && referrers.length === 0 ? (
                    <div className="flex items-center justify-center py-40 flex-1">
                        <Loader2 className="animate-spin text-accent" size={32} />
                    </div>
                ) : referrers.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-40 text-neutral-500 bg-surface border border-foreground/5 rounded-3xl flex-1 flex flex-col items-center justify-center space-y-4"
                    >
                        <Users size={48} className="opacity-20" />
                        <p className="text-sm tracking-widest uppercase">No referrers generated links yet</p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-surface border border-foreground/5 rounded-3xl p-6 lg:p-8 flex-1 flex flex-col"
                    >
                        <div className="overflow-x-auto custom-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0 pb-4">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-foreground/10">
                                        <th className="py-4 px-4 text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Affiliate</th>
                                        <th className="py-4 px-4 text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Generated Link</th>
                                        <th className="py-4 px-4 text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Performance</th>
                                        <th className="py-4 px-4 text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Contact Info</th>
                                        <th className="py-4 px-4 text-[10px] text-neutral-500 uppercase tracking-widest font-bold text-right">Created</th>
                                        <th className="py-4 px-4 text-[10px] text-neutral-500 uppercase tracking-widest font-bold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {referrers.map((ref, idx) => (
                                        <tr key={ref.code} className="border-b border-foreground/5 hover:bg-foreground/2 transition-colors group">
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center text-[10px] font-bold text-neutral-400 group-hover:text-accent group-hover:border-accent/30 transition-colors shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">{ref.referrer_name}</div>
                                                        <div className="text-[11px] text-neutral-500">{ref.referrer_email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-accent text-xs bg-accent/10 px-2 py-1 rounded border border-accent/20">
                                                        {ref.code}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}?ref=${ref.code}`);
                                                            showNotification('Link copied to clipboard');
                                                        }}
                                                        className="text-neutral-500 hover:text-foreground transition-colors"
                                                        title="Copy full link"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between max-w-[120px]">
                                                        <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Successful:</span>
                                                        <span className="font-bold text-emerald-400 font-mono">{ref.successful_referrals_count}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between max-w-[120px]">
                                                        <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Used by:</span>
                                                        <span className="font-bold text-foreground font-mono">{ref.used_by_emails?.length || 0}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 text-sm">
                                                {ref.referrer_instagram ? (
                                                    <a href={`https://instagram.com/${ref.referrer_instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors">
                                                        <span>{ref.referrer_instagram}</span>
                                                        <ExternalLink size={12} />
                                                    </a>
                                                ) : <span className="text-neutral-600 italic">No Instagram</span>}
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5 text-neutral-400 text-xs text-right">
                                                    <Calendar size={12} />
                                                    <span>{new Date(ref.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                <button onClick={() => setAffiliateToDelete(ref.code)} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-foreground transition-colors border border-red-500/20 mx-auto">
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {affiliateToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface border border-foreground/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6"
                        >
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                                    <Trash2 size={24} />
                                </div>
                                <h3 className="text-xl font-serif text-foreground">
                                    Delete Affiliate
                                </h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    Are you sure you want to permanently delete this affiliate? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-foreground/5">
                                <button
                                    onClick={() => setAffiliateToDelete(null)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 rounded-full border border-foreground/10 text-foreground font-bold text-sm hover:bg-foreground/5 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 rounded-full bg-red-500 text-foreground font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                                >
                                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Notification Toast */}
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 50, x: '-50%' }}
                    className={`fixed bottom-8 left-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold shadow-2xl ${notification.type === 'error' ? 'bg-red-500 text-foreground' : 'bg-emerald-500 text-foreground'
                        }`}
                >
                    <Check size={16} />
                    {notification.message}
                </motion.div>
            )}

            {/* Background Texture Blur */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-background">
                <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>
        </div>
    );
}
