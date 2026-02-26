'use client';

import GoogleSignInButton from '@/components/GoogleSignInButton';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block p-3 rounded-2xl bg-accent/10 mb-4"
                    >
                        <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl font-cinzel text-white"
                    >
                        Admin Portal
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-2 text-sm text-neutral-500 uppercase tracking-widest"
                    >
                        Authorized Access Only
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-surface border border-white/5 p-8 rounded-3xl shadow-2xl space-y-6"
                >
                    <p className="text-sm text-center text-neutral-400">
                        Please sign in with your authorized Google account to access the administrative dashboard.
                    </p>

                    <GoogleSignInButton />

                    <div className="flex items-center justify-center gap-2 pt-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[10px] text-neutral-600 uppercase tracking-tighter">Secure encrypted session</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                >
                    <a
                        href="/"
                        className="text-xs text-neutral-600 hover:text-accent transition-colors font-medium uppercase tracking-widest"
                    >
                        ← Back to Home
                    </a>
                </motion.div>
            </div>

            {/* Background Blurs */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-accent/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />
            </div>
        </div>
    );
}
