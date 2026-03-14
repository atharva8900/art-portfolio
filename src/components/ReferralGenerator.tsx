'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Copy, Check, ChevronDown, LayoutDashboard, ArrowRight, QrCode, X } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import AuthOptions from './AuthOptions';
import { Turnstile } from '@marsidev/react-turnstile';

export default function ReferralGenerator() {
    const { data: session, status: authStatus } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [referralLink, setReferralLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [infoMessage, setInfoMessage] = useState('');
    const [isRulesOpen, setIsRulesOpen] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [showTurnstile, setShowTurnstile] = useState(true);

    const user = session?.user;
    const authLoading = authStatus === 'loading';

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setInfoMessage('');
        setReferralLink('');

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/referrals/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    turnstile_token: turnstileToken
                }),
            });

            const result = await res.json(); // Parse JSON once

            if (!res.ok) {
                throw new Error(result.error || 'Failed to generate link');
            }

            // Encode referrer data
            const referrerData = btoa(JSON.stringify({
                name: result.referrer_name,
                email: result.referrer_email,
                phone: result.referrer_phone
            }));

            const link = `${window.location.origin}?ref=${result.referral_code}&d=${referrerData}`;
            setReferralLink(link);
            if (result.message) {
                setInfoMessage(result.message);
            }

        } catch (error: unknown) {
            const err = error as { message?: string };
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    const copyToClipboard = () => {
        if (referralLink) {
            navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <section id="referrals" className="py-24 px-6 md:px-12 bg-background">
            <div className="max-w-xl mx-auto text-center space-y-8">
                <div>
                    <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-2">Earn 20% Commission Per Referral</h2>
                    <p className="text-neutral-400 text-sm">Create your unique link and share it with friends.</p>
                </div>

                {authLoading ? (
                    <div className="space-y-4 animate-pulse py-8">
                        <div className="h-12 bg-foreground/5 rounded-lg w-full" />
                        <div className="h-12 bg-foreground/5 rounded-lg w-full" />
                        <div className="h-12 bg-foreground/5 rounded-lg w-full" />
                        <div className="h-12 bg-foreground/10 rounded-lg w-full" />
                    </div>
                ) : (
                    <>
                        {/* Dashboard Promo for Logged In Users */}
                        {user && (
                            <div className="mb-8 bg-foreground/5 border border-accent/20 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-accent/20 rounded-full text-accent">
                                        <LayoutDashboard size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-foreground font-medium text-sm">Track Your Earnings</h3>
                                        <p className="text-neutral-400 text-xs text-left">Check the status of your referrals & request payouts.</p>
                                    </div>
                                </div>
                                <Link
                                    href="/dashboard"
                                    className="w-full md:w-auto px-4 py-2 bg-foreground text-background text-xs font-bold uppercase tracking-wider rounded hover:bg-neutral-200 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                                >
                                    Go to Referral dashboard <ArrowRight size={14} />
                                </Link>
                            </div>
                        )}

                        {!user ? (
                            <div className="space-y-6">
                                <div className="bg-surface border border-foreground/10 p-8 rounded-lg">
                                    <AuthOptions
                                        description="Sign in with Google to create your referral link, or use your email for a secure login link."
                                    />
                                </div>
                            </div>
                        ) : !referralLink ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-4">
                                    <input
                                        required
                                        name="name"
                                        type="text"
                                        defaultValue={user.name || ''}
                                        placeholder="Your Name"
                                        className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors"
                                    />
                                    <input
                                        required
                                        name="email"
                                        type="email"
                                        defaultValue={user.email || ''}
                                        placeholder="Your Email"
                                        readOnly
                                        className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors opacity-75"
                                    />
                                    <input
                                        required
                                        name="phone"
                                        type="tel"
                                        placeholder="Your Phone (for verification)"
                                        className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors"
                                    />
                                    <input
                                        name="instagram"
                                        type="text"
                                        placeholder="Your Instagram (optional)"
                                        className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors"
                                    />
                                </div>

                                {error && <p className="text-red-400 text-sm">{error}</p>}

                                <AnimatePresence>
                                    {showTurnstile && (
                                        <motion.div
                                            initial={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                                            className="flex justify-center items-center transition-all duration-500 overflow-hidden min-h-[70px]"
                                            onMouseEnter={() => window.dispatchEvent(new Event('cursor-hide'))}
                                            onMouseLeave={() => window.dispatchEvent(new Event('cursor-show'))}
                                        >
                                            <Turnstile
                                                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                                                onSuccess={(token) => {
                                                    setTurnstileToken(token);
                                                    setTimeout(() => setShowTurnstile(false), 5000);
                                                }}
                                                options={{ theme: 'dark' }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={loading || (!turnstileToken && showTurnstile)}
                                    className="w-full bg-foreground text-background font-bold uppercase tracking-widest py-4 rounded-lg hover:bg-neutral-200 hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Generate Link'}
                                </button>
                            </form>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-surface p-6 border border-accent/20 rounded-lg space-y-4"
                            >
                                <p className={`${infoMessage ? 'text-amber-400' : 'text-emerald-400'} font-medium`}>
                                    {infoMessage ? 'Existing Active Link Retrieved' : 'Link Generated Successfully!'}
                                </p>

                                {infoMessage && (
                                    <p className="text-neutral-400 text-sm bg-amber-400/10 border border-amber-400/20 p-2 rounded">
                                        {infoMessage}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 bg-background/50 p-3 rounded-md border border-foreground/10">
                                    <code className="text-neutral-300 text-sm flex-1 truncate text-left">{referralLink}</code>
                                    <button
                                        onClick={copyToClipboard}
                                        className="text-neutral-400 hover:text-foreground transition-colors p-1"
                                        title="Copy Link"
                                    >
                                        {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                                    </button>
                                    <button
                                        onClick={() => setShowQR(true)}
                                        className="text-neutral-400 hover:text-foreground transition-colors p-1"
                                        title="Show QR Code"
                                    >
                                        <QrCode size={18} />
                                    </button>
                                </div>

                                <p className="text-xs text-neutral-500">
                                    Share this link. You will earn 20% for every confirmed commission.
                                </p>

                                {!infoMessage && (
                                    <button
                                        onClick={() => setReferralLink('')}
                                        className="text-xs text-neutral-400 hover:text-foreground underline mt-2"
                                    >
                                        Generate another
                                    </button>
                                )}
                                {infoMessage && (
                                    <p className="text-xs text-neutral-500 mt-2">
                                        Note: You can generate a new link only after this one expires (3 commissions).
                                    </p>
                                )}

                                {/* QR Code Modal */}
                                <AnimatePresence>
                                    {showQR && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                                            onClick={() => setShowQR(false)}
                                        >
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.9, opacity: 0 }}
                                                className="bg-background border border-foreground/10 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl relative"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => setShowQR(false)}
                                                    className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-foreground hover:bg-foreground/10 rounded-full transition-colors"
                                                >
                                                    <X size={20} />
                                                </button>

                                                <div className="space-y-2">
                                                    <h3 className="font-serif text-xl text-foreground mt-2">Your Referral QR</h3>
                                                    <p className="text-xs text-neutral-400">Scan to visit the portfolio with your referral applied</p>
                                                </div>

                                                <div className="bg-white p-4 rounded-2xl mx-auto inline-block border-4 border-accent/20">
                                                    <QRCodeSVG
                                                        value={referralLink}
                                                        size={220}
                                                        level="H"
                                                        includeMargin={false}
                                                    />
                                                </div>

                                                <div className="pt-2">
                                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Scan to open link</p>
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </>
                )}

                {/* Referral Program Rules - Collapsible Accordion */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: false }}
                    className="mt-12 bg-surface border border-foreground/10 rounded-xl overflow-hidden"
                >
                    {/* Accordion Header */}
                    <button
                        onClick={() => setIsRulesOpen(!isRulesOpen)}
                        aria-expanded={isRulesOpen}
                        aria-controls="referral-rules-content"
                        className="w-full flex items-center justify-between p-6 md:p-8 cursor-pointer hover:bg-surface/80 transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
                    >
                        <h3 className="font-serif text-xl md:text-2xl text-foreground text-left">
                            Referral Program – How It Works
                        </h3>
                        <ChevronDown
                            className={`text-accent flex-shrink-0 ml-4 transition-transform duration-300 ${isRulesOpen ? 'rotate-180' : ''}`}
                            size={24}
                        />
                    </button>

                    {/* Accordion Content */}
                    <AnimatePresence initial={false}>
                        {isRulesOpen && (
                            <motion.div
                                id="referral-rules-content"
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="px-6 pb-6 md:px-8 md:pb-8 space-y-6 text-foreground/80 dark:text-neutral-300 text-sm md:text-base text-left">
                                    {/* Section 1 */}
                                    <div>
                                        <h4 className="text-foreground font-bold mb-2">Sharing</h4>
                                        <ul className="space-y-1 pl-5 list-disc">
                                            <li>You can share your referral link with unlimited people.</li>
                                            <li>Referrers earn 20% commission on the <strong>Artwork Price</strong> (Base Price + Detailed Background).</li>
                                            <li>Timelapse, delivery, and framing charges are excluded from commission calculation.</li>
                                        </ul>
                                    </div>

                                    {/* Section 2 */}
                                    <div>
                                        <h4 className="text-foreground font-bold mb-2">Referral Link Expiration</h4>
                                        <ul className="space-y-1 pl-5 list-disc">
                                            <li>Each referral link expires after 3 successful commissions.</li>
                                            <li>Once expired:
                                                <ul className="pl-5 mt-1 space-y-1 list-circle">
                                                    <li>The link cannot be used anymore.</li>
                                                    <li>You can generate a new link to continue earning.</li>
                                                </ul>
                                            </li>
                                            <li>Expired links cannot be reused.</li>
                                        </ul>
                                    </div>

                                    {/* Section 3 */}
                                    <div>
                                        <h4 className="text-foreground font-bold mb-2">Fair Use Policy</h4>
                                        <ul className="space-y-1 pl-5 list-disc">
                                            <li>Self-referrals (orders placed by the same individual using their own referral link) are not eligible for commission.</li>
                                            <li>Commission is paid only for genuine third-party referrals, at the artist’s discretion and is manually approved after successful completion of the artwork.</li>
                                            {/* Removed per user request: Max 2 referrals per household/network per 24 hours. */}
                                            <li>Duplicate or suspicious activity is automatically blocked.</li>
                                            <li>Referral validation is handled automatically.</li>
                                        </ul>
                                    </div>

                                    {/* Section 4 */}
                                    <div>
                                        <h4 className="text-foreground font-bold mb-2">Important</h4>
                                        <ul className="space-y-1 pl-5 list-disc">
                                            <li>If a referral is invalid, the commission request will still go through.</li>
                                            <li>In that case, no referral commission will be awarded.</li>
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
}
