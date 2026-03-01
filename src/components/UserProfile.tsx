'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, User as UserIcon, LayoutDashboard, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALLOWED_EMAILS = [
    'atharva8900@gmail.com',
    'atharvasherlekarart@gmail.com',
    'atharvasherlekar@gmail.com'
];

export default function UserProfile() {
    const { data: session, status } = useSession();
    const [showMenu, setShowMenu] = useState(false);
    const [imageError, setImageError] = useState(false);

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
            <button
                onClick={() => signIn('google')}
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
                {user.image && !imageError ? (
                    <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                        onError={() => setImageError(true)}
                        unoptimized
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center border border-neutral-600">
                        <UserIcon size={16} />
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
                            className="absolute right-0 mt-2 w-64 bg-surface border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-50"
                        >
                            <div className="p-4 border-b border-neutral-800">
                                <p className="text-sm font-medium">{user.name || 'User'}</p>
                                <p className="text-xs text-neutral-400 mt-1">{user.email}</p>
                            </div>

                            {user.email && ALLOWED_EMAILS.includes(user.email) && (
                                <Link
                                    href="/admin"
                                    className="w-full px-4 py-3 flex items-center gap-2 hover:bg-surface/80 transition-colors text-left border-b border-neutral-800 text-accent"
                                >
                                    <LayoutDashboard size={16} />
                                    <span className="text-sm font-medium">Admin Dashboard</span>
                                </Link>
                            )}

                            <Link
                                href="/client/dashboard"
                                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-surface/80 transition-colors text-left border-b border-neutral-800"
                            >
                                <Palette size={16} />
                                <span className="text-sm">My Commissions</span>
                            </Link>

                            <Link
                                href="/dashboard"
                                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-surface/80 transition-colors text-left"
                            >
                                <UserIcon size={16} />
                                <span className="text-sm">Referral dashboard</span>
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
