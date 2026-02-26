'use client';

import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

interface ReferralCodesProps {
    activeReferral: {
        code: string;
        successful_referrals_count: number;
    } | null;
}

export default function ReferralCodes({ activeReferral }: ReferralCodesProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        if (!activeReferral) return;

        const link = `${window.location.origin}/?ref=${activeReferral.code}`;
        navigator.clipboard.writeText(link);
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
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 w-full bg-background/50 border border-foreground/10 rounded-lg p-4 font-mono text-lg text-center md:text-left tracking-wider text-accent">
                            {activeReferral.code}
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className={`w-full md:w-auto px-6 py-4 rounded-lg font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${copied
                                ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                : 'bg-accent text-background hover:bg-foreground border border-accent'
                                }`}
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
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
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-neutral-400 mb-4">You don&apos;t have an active referral code yet.</p>
                    <a
                        href="/#referrals"
                        className="inline-block px-6 py-3 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 rounded-lg transition-colors"
                    >
                        Generate Code
                    </a>
                </div>
            )}
        </div>
    );
}
