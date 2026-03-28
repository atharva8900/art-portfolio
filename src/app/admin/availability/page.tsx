'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Lock, Unlock, Power, AlertCircle } from 'lucide-react';
import { ADMIN_EMAILS } from '@/lib/config/constants';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

const ALLOWED_EMAILS = ADMIN_EMAILS;

const PREDEFINED_REASONS = [
    "Busy with current orders",
    "Personal break",
    "Unavailable at this moment",
    "Taking a short break"
];

export default function AdminAvailability() {
    const { data: session, status } = useSession();
    const [statusLoading, setStatusLoading] = useState(false);
    const [error, setError] = useState('');
    const [isOpen, setIsOpen] = useState<boolean | null>(null);
    const [reason, setReason] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [reopenDate, setReopenDate] = useState('');
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const router = useRouter();

    // Check status on load (if authenticated)
    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/availability');
            const data = await res.json();
            setIsOpen(data.is_accepting_commissions);
            
            const loadedReason = data.closure_reason || '';
            setReason(loadedReason);
            // If the reason isn't in our predefined list, it's a custom one
            setIsCustom(loadedReason !== '' && !PREDEFINED_REASONS.includes(loadedReason));
            
            setReopenDate(data.reopen_date ? new Date(data.reopen_date).toISOString().split('T')[0] : '');
            setLastUpdated(data.last_updated);
        } catch {
            console.error('Failed to fetch status');
        }
    };

    const userEmail = session?.user?.email;
    const isAuthenticated = !!session && !!userEmail && ALLOWED_EMAILS.includes(userEmail.toLowerCase());

    useEffect(() => {
        if (isAuthenticated) {
            fetchStatus();
        }
    }, [isAuthenticated]);

    const toggleStatus = async (targetStatus: boolean) => {
        setStatusLoading(true);
        setError('');

        try {
            const res = await fetch('/api/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    isOpen: targetStatus,
                    reason: targetStatus ? '' : reason,
                    reopenDate: targetStatus ? null : reopenDate
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Redirect handled via session change
                throw new Error(data.error || 'Failed to update status');
            }

            setIsOpen(targetStatus);
            setLastUpdated(data.updated);
        } catch (error: unknown) {
            const err = error as { message?: string };
            setError(err.message || 'Failed to update status');
        } finally {
            setStatusLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-surface border border-foreground/10 p-8 rounded-xl space-y-6 text-center"
                >
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-serif">Unauthorized Access</h1>
                    <p className="text-neutral-400 text-sm mt-2">
                        You do not have permission to view this page.
                    </p>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-foreground text-background font-bold uppercase tracking-widest py-4 rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                        Go to Home / Login
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AdminNav />
            <div className="max-w-2xl mx-auto space-y-12 p-6 md:p-12 pt-8">

                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-serif">Commission Control</h1>
                        <p className="text-neutral-500 text-sm mt-1">Logged in as {userEmail}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-8 rounded-2xl border-2 transition-colors duration-500 flex flex-col items-center text-center space-y-6 ${isOpen ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-red-900/20 border-red-500/50'
                            }`}
                    >
                        <div className={`p-4 rounded-full ${isOpen ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                            {isOpen ? <Unlock size={48} /> : <Lock size={48} />}
                        </div>

                        <div>
                            <h2 className="text-3xl font-bold mb-2">
                                {isOpen ? 'Commissions are OPEN' : 'Commissions are CLOSED'}
                            </h2>
                            <p className="text-neutral-400">
                                {isOpen
                                    ? 'Visitors can currently submit commission requests.'
                                    : 'The commission form is hidden and submissions are disabled.'}
                            </p>
                        </div>

                        <button
                            onClick={() => toggleStatus(!isOpen)}
                            disabled={statusLoading}
                            className={`px-8 py-4 rounded-lg font-bold uppercase tracking-widest flex items-center gap-3 transition-transform active:scale-95 ${isOpen
                                ? 'bg-red-500 hover:bg-red-400 text-foreground'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-background'
                                }`}
                        >
                            {statusLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <Power size={20} />
                            )}
                            {isOpen ? 'Close Commissions' : 'Open Commissions'}
                        </button>

                        {!isOpen && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="w-full space-y-4 pt-4 border-t border-red-500/20"
                            >
                                <div className="space-y-2 text-left">
                                    <label className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Closure Reason</label>
                                    <select 
                                        value={isCustom ? 'CUSTOM' : reason}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'CUSTOM') {
                                                setIsCustom(true);
                                                // Don't clear the reason immediately as they might have been typing
                                            } else {
                                                setIsCustom(false);
                                                setReason(val);
                                            }
                                        }}
                                        className="w-full bg-background/50 border border-foreground/10 p-3 rounded-lg text-foreground outline-none focus:border-red-500/50 appearance-none cursor-pointer hover:bg-background/80 transition-colors"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.3)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
                                    >
                                        {PREDEFINED_REASONS.map(r => (
                                            <option key={r} value={r} className="bg-neutral-900">{r}</option>
                                        ))}
                                        <option value="CUSTOM" className="bg-neutral-900">Custom Reason...</option>
                                    </select>
                                    {isCustom && (
                                        <input 
                                            type="text"
                                            value={reason}
                                            placeholder="Enter custom reason..."
                                            className="w-full bg-background/50 border border-foreground/10 p-3 rounded-lg text-foreground outline-none focus:border-red-500/50 mt-2"
                                            onChange={(e) => setReason(e.target.value)}
                                        />
                                    )}
                                </div>

                                <div className="space-y-2 text-left">
                                    <label className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Expected Reopen Date (Optional)</label>
                                    <input 
                                        type="date"
                                        value={reopenDate}
                                        onChange={(e) => setReopenDate(e.target.value)}
                                        className="w-full bg-background/50 border border-foreground/10 p-3 rounded-lg text-foreground outline-none focus:border-red-500/50"
                                    />
                                    <p className="text-[10px] text-neutral-500 italic">
                                        The site will automatically reopen on this date.
                                    </p>
                                </div>

                                <button 
                                    onClick={() => toggleStatus(false)}
                                    disabled={statusLoading}
                                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-xs font-bold uppercase tracking-widest transition-all"
                                >
                                    Update Closure Settings
                                </button>
                            </motion.div>
                        )}

                        {lastUpdated && (
                            <p className="text-xs text-neutral-600 font-mono">
                                Last Updated: {new Date(lastUpdated).toLocaleDateString('en-GB')} {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                        )}
                    </motion.div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex items-center gap-3 text-red-200"
                    >
                        <AlertCircle size={20} />
                        <p>{error}</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
