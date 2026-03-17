'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { Turnstile } from '@marsidev/react-turnstile';

interface AuthOptionsProps {
    callbackUrl?: string;
    description?: string;
}

export default function AuthOptions({
    callbackUrl = '/',
    description = "Sign in with Google for instant access, or use your email to receive a passwordless secure login link."
}: AuthOptionsProps) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [showTurnstile, setShowTurnstile] = useState(true);

    useEffect(() => {
        if (turnstileToken) {
            const timer = setTimeout(() => {
                setShowTurnstile(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [turnstileToken]);

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn('email', {
                email,
                callbackUrl,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                setIsSent(true);
            }
        } catch {
            setError('Failed to send magic link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <AnimatePresence mode="wait">
                {isSent ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-center space-y-4 py-4"
                    >
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-xl font-medium text-white">Check your email</h2>
                        <p className="text-sm text-neutral-400">
                            A magic link has been sent to your inbox. Use the link to sign in instantly.
                        </p>
                        <button
                            onClick={() => setIsSent(false)}
                            className="text-xs text-accent hover:underline uppercase tracking-widest pt-4"
                        >
                            Try another email
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <p className="text-sm text-center text-neutral-400">
                            {description}
                        </p>

                        <AnimatePresence>
                            {showTurnstile && (
                                <motion.div
                                    initial={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    <div 
                                        className="flex justify-center items-center min-h-[70px]"
                                        onMouseEnter={() => window.dispatchEvent(new CustomEvent('cursor-hide'))}
                                        onMouseLeave={() => window.dispatchEvent(new CustomEvent('cursor-show'))}
                                    >
                                        <Turnstile
                                            siteKey={
                                                (typeof window !== 'undefined' && window.location.hostname === 'localhost')
                                                    ? '1x00000000000000000000AA' 
                                                    : (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA')
                                            }
                                            onSuccess={setTurnstileToken}
                                            options={{ theme: 'dark' }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <GoogleSignInButton callbackUrl={callbackUrl} turnstileToken={turnstileToken} />

                        <div className="relative flex items-center gap-4 py-2">
                            <div className="h-px flex-1 bg-white/5" />
                            <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">OR</span>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>

                        <form onSubmit={handleEmailSignIn} className="space-y-4">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-accent transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email Address"
                                    required
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-accent/50 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !turnstileToken}
                                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        Sign in with Email
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {error && (
                            <p className="text-xs text-red-500 text-center animate-shake">
                                {error === 'Email' ? 'Failed to send link. Check your email settings.' : error}
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
