'use client';

import { useState } from 'react';
import { Check, Share2, MousePointerClick, QrCode, X, Copy } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReferralCodesProps {
    activeReferral: {
        code: string;
        successful_referrals_count: number;
        click_count?: number;
    } | null;
}

export default function ReferralCodes({ activeReferral }: ReferralCodesProps) {
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const referralLink = activeReferral 
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${activeReferral.code}`
        : '';

    const copyToClipboard = () => {
        if (!activeReferral) return;

        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-surface border border-foreground/10 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-serif text-foreground mb-6 flex items-center gap-2">
                <Share2 size={24} className="text-accent" />
                Active Referral Code
            </h2>

            {activeReferral ? (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        {/* Referral Code with Internal Copy Icon */}
                        <div className="flex-1 w-full relative group/code">
                            <div className="w-full bg-background/50 border border-foreground/10 rounded-xl p-4 pr-14 font-mono text-lg text-center md:text-left tracking-wider text-accent overflow-hidden truncate">
                                {activeReferral.code}
                            </div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                <button
                                    onClick={() => setShowQR(true)}
                                    className="p-3 text-neutral-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                                    title="Share Referral Link"
                                >
                                    <QrCode size={22} />
                                </button>
                            </div>
                        </div>

                        {/* Clicks Metric Display */}
                        <div className="w-full md:w-auto min-w-[140px] bg-background/30 border border-foreground/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-2 text-neutral-400 text-[10px] uppercase tracking-widest font-bold mb-1">
                                <MousePointerClick size={14} className="text-accent/70" />
                                Link Clicks
                            </div>
                            <div className="text-2xl font-serif text-foreground leading-none">
                                {activeReferral.click_count || 0}
                            </div>
                        </div>
                    </div>

                    <div className="bg-foreground/5 rounded-lg p-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-neutral-400">Usage Limit</span>
                            <span className="text-foreground font-medium">{activeReferral.successful_referrals_count} / 3</span>
                        </div>
                        <div className="w-full bg-surface hover:bg-surface\/80 rounded-full h-2">
                            <div
                                className="bg-accent h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(activeReferral.successful_referrals_count / 3) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                            Each active code can be used for up to 3 successful commissions.
                            Once filled, you can generate a new code.
                        </p>
                    </div>

                    {/* QR Code Modal */}
                    <AnimatePresence>
                        {showQR && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowQR(false)}
                                    className="absolute inset-0 bg-background/90 backdrop-blur-md"
                                />
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    className="relative bg-surface border border-foreground/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
                                >
                                    <button
                                        onClick={() => setShowQR(false)}
                                        className="absolute top-4 right-4 text-neutral-500 hover:text-foreground transition-colors"
                                    >
                                        <X size={24} />
                                    </button>

                                    <h3 className="text-xl font-serif text-foreground mb-2">Share QR Code</h3>
                                    <p className="text-sm text-neutral-400 mb-8">Let your friends scan this code to claim their 20% discount.</p>

                                    <div className="bg-white p-6 rounded-2xl inline-block shadow-inner mb-6 mx-auto">
                                        <QRCodeSVG
                                            value={referralLink}
                                            size={200}
                                            level="H"
                                            includeMargin={false}
                                            imageSettings={{
                                                src: "/logo.png",
                                                x: undefined,
                                                y: undefined,
                                                height: 40,
                                                width: 40,
                                                excavate: true,
                                            }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 bg-accent/5 p-1 rounded-xl border border-accent/10">
                                        <div className="flex-1 text-[10px] font-mono text-accent py-2 px-3 break-all text-left overflow-hidden truncate">
                                            {referralLink}
                                        </div>
                                        <button
                                            onClick={copyToClipboard}
                                            className={`p-2 rounded-lg transition-all ${copied
                                                ? 'bg-green-500 text-white'
                                                : 'bg-accent text-background hover:bg-foreground'
                                                }`}
                                            title="Copy Link"
                                        >
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-neutral-400 mb-4">You don&apos;t have an active referral code yet.</p>
                    <Link
                        href="/#referrals"
                        className="inline-block px-8 py-4 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 rounded-xl transition-all font-bold uppercase tracking-widest text-sm"
                    >
                        Generate Code
                    </Link>
                </div>
            )}
        </div>
    );
}
