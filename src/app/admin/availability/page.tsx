'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, Unlock, Power, AlertCircle } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com', 'atharvasherlekar@gmail.com'];

export default function AdminAvailability() {
    const { data: session, status } = useSession();
    const [statusLoading, setStatusLoading] = useState(false);
    const [error, setError] = useState('');
    const [isOpen, setIsOpen] = useState<boolean | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const router = useRouter();

    // Check status on load (if authenticated)
    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/availability');
            const data = await res.json();
            setIsOpen(data.is_accepting_commissions);
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
                body: JSON.stringify({ isOpen: targetStatus }),
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

                        {lastUpdated && (
                            <p className="text-xs text-neutral-600 font-mono">
                                Last Updated: {new Date(lastUpdated).toLocaleString()}
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
