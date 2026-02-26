'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com'];

export default function UserProfile() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [imageError, setImageError] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        // Suppress Supabase AbortErrors (thrown when project is unreachable/paused)
        // to prevent them becoming unhandled rejections that crash the error overlay.
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            if (event.reason?.name === 'AbortError') {
                event.preventDefault();
            }
        };
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('Error fetching session:', error);
                }
                setUser(session?.user ?? null);
            } catch (error) {
                if ((error as Error)?.name !== 'AbortError') {
                    console.error('Unexpected error fetching session:', error);
                }
            } finally {
                setLoading(false);
            }
        };

        getSession();

        // Listen for auth changes
        let subscription: { unsubscribe: () => void } | null = null;
        try {
            const { data } = supabase.auth.onAuthStateChange((_event: string, session: import('@supabase/supabase-js').Session | null) => {
                setUser(session?.user ?? null);
                setImageError(false);
            });
            subscription = data.subscription;
        } catch (error) {
            if ((error as Error)?.name !== 'AbortError') {
                console.error('Error setting up auth listener:', error);
            }
        }

        return () => {
            subscription?.unsubscribe();
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [supabase.auth]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setShowMenu(false);
        setImageError(false);
    };

    if (loading) {
        return null;
    }

    if (!user) {
        return (
            <button
                onClick={async () => {
                    const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: `${window.location.origin}/auth/callback`,
                        },
                    });
                    if (error) console.error('Sign in error:', error);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm"
            >
                <UserIcon size={16} />
                <span>Sign In</span>
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface/80 transition-colors"
            >
                {user.user_metadata.avatar_url && !imageError ? (
                    <Image
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata.full_name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                        onError={() => setImageError(true)}
                        unoptimized // Adding unoptimized to avoid hostname config issues if any, though config seems open.
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                        <UserIcon size={16} />
                    </div>
                )}
                <span className="text-sm font-medium hidden md:block">
                    {user.user_metadata.full_name || user.email}
                </span>
            </button>

            <AnimatePresence>
                {showMenu && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-64 bg-surface border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-50"
                        >
                            <div className="p-4 border-b border-neutral-800">
                                <p className="text-sm font-medium">{user.user_metadata.full_name || 'User'}</p>
                                <p className="text-xs text-neutral-400 mt-1">{user.email}</p>
                            </div>

                            {user.email && ALLOWED_EMAILS.includes(user.email) && (
                                <a
                                    href="/admin"
                                    className="w-full px-4 py-3 flex items-center gap-2 hover:bg-surface/80 transition-colors text-left border-b border-neutral-800 text-accent"
                                >
                                    <LayoutDashboard size={16} />
                                    <span className="text-sm font-medium">Admin Dashboard</span>
                                </a>
                            )}

                            <a
                                href="/dashboard"
                                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-surface/80 transition-colors text-left"
                            >
                                <UserIcon size={16} />
                                <span className="text-sm">Referral dashboard</span>
                            </a>
                            <button
                                onClick={handleSignOut}
                                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-surface/80 transition-colors text-left"
                            >
                                <LogOut size={16} />
                                <span className="text-sm">Sign out</span>
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
