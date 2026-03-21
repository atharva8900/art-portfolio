'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, User as UserIcon, LayoutDashboard, Palette } from 'lucide-react';
import { ADMIN_EMAILS } from '@/lib/config/constants';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserProfile() {
    const { data: session, status } = useSession();
    const [showMenu, setShowMenu] = useState(false);
    const [imageError, setImageError] = useState(false);

    const ALLOWED_EMAILS = ADMIN_EMAILS;

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        setShowMenu(false);
        setImageError(false);
    };

    if (status === 'loading') {
        return null; // Or a small shimmer
    }

    const user = session?.user;

    if (!user) {
        return (
            <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm"
            >
                <UserIcon size={16} />
                <span>Sign In</span>
            </Link>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface/80 transition-colors"
            >
                {user.image && !imageError ? (
                    <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                        referrerPolicy="no-referrer"
                        onError={() => setImageError(true)}
                        unoptimized
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-accent text-zinc-950 flex items-center justify-center font-bold text-xs uppercase">
                        {(user.name || user.email || '?').charAt(0)}
                    </div>
                )}
                <span className="text-sm font-medium hidden md:block">
                    {user.name || user.email}
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
                            className="absolute right-0 mt-2 w-64 bg-background/95 backdrop-blur-xl border border-foreground/10 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                            <div className="p-4 border-b border-foreground/10">
                                <p className="text-sm font-medium">{user.name || 'User'}</p>
                                <p className="text-xs text-neutral-500 mt-1">{user.email}</p>
                            </div>

                            {user.email && ALLOWED_EMAILS.includes(user.email) && (
                                <Link
                                    href="/admin"
                                    className="w-full px-4 py-3 flex items-center gap-2 hover:bg-surface/80 transition-colors text-left border-b border-foreground/10 text-accent font-medium"
                                >
                                    <LayoutDashboard size={18} />
                                    <span className="text-sm">Admin Dashboard</span>
                                </Link>
                            )}

                            <Link
                                href="/client/dashboard"
                                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-surface/80 transition-colors text-left border-b border-foreground/10"
                            >
                                <Palette size={18} />
                                <span className="text-sm font-medium">My Commissions</span>
                            </Link>

                            <Link
                                href="/dashboard"
                                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-surface/80 transition-colors text-left"
                            >
                                <UserIcon size={18} />
                                <span className="text-sm font-medium">Referral dashboard</span>
                            </Link>
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
