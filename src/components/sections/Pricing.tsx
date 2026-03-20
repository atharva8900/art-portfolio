'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, CreditCard, ImageIcon, Package, Globe, ShieldCheck, Star, Crown } from 'lucide-react';

interface PricingTierData {
    isEarlyAccess: boolean;
    commissionCount: number;
    prices: {
        A5: string;
        A4: string;
        A3: string;
    };
    progress: {
        current: number;
        total: number;
        remaining: number;
    };
}

// Fixed Variants (defined outside component with 'as const' to fix Vercel build)
const containerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
} as const;

export default function Pricing() {

    const [pricingData, setPricingData] = useState<PricingTierData>({
        isEarlyAccess: true,
        commissionCount: 0,
        prices: { A5: '₹500', A4: '₹1000', A3: '₹2000' },
        progress: { current: 0, total: 10, remaining: 10 },
    });

    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        fetch(`/api/pricing-tier?t=${Date.now()}`, { signal: controller.signal })
            .then(res => res.json())
            .then(data => {
                setPricingData(data);
            })
            .catch(err => {
                if (err.name !== 'AbortError') console.error('Failed to fetch pricing tier:', err);
            });


        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, []);

    const pricingItems = useMemo(() => {
        const futurePrices = {
            A5: '₹750',
            A4: '₹1500',
            A3: '₹3000',
        };

        return [
            { size: 'A5' as const, price: pricingData.prices.A5, futurePrice: futurePrices.A5, subtitle: 'Perfect for tabletops & small spaces', badge: null },
            { size: 'A4' as const, price: pricingData.prices.A4, futurePrice: futurePrices.A4, subtitle: 'Best for couple portraits & fanart', badge: { icon: Star, text: 'Most Popular' } },
            { size: 'A3' as const, price: pricingData.prices.A3, futurePrice: pricingData.prices.A3 === '₹2000' ? futurePrices.A3 : '₹4000', subtitle: 'Maximum detail & group portraits', badge: { icon: Crown, text: 'Grand Portrait' } }
        ];
    }, [pricingData.prices]);

    const policyItems = useMemo(() => [
        { icon: Users, text: "Group Portraits: A4 & A3 get 50% off for every additional face. A5 charged at base price per person." },
        { icon: CreditCard, text: "50% advance to confirm. Waitlist reservations: 25% to hold your spot" },
        { icon: ImageIcon, text: "Detailed background: +₹500" },
        { icon: Package, text: "Framing & delivery charges apply" },
        { icon: ShieldCheck, text: "All artworks are packed & shipped with care" },
        { icon: Globe, text: "Available all over India & worldwide" }
    ], []);

    return (
        <section id="pricing" className="py-24 px-6 md:px-12 bg-surface text-foreground">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">Commission Details</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 text-lg">Transparent pricing and clear policies for your custom portrait.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    <div className="p-6 sm:p-8 md:p-10 rounded-2xl bg-background dark:bg-foreground/5 border border-border/80 dark:border-foreground/10 shadow-sm dark:shadow-none">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false }}
                        >
                            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-8">Portrait Pricing</h2>

                            {pricingData.isEarlyAccess && (
                                <motion.div
                                    variants={itemVariants}
                                    className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 dark:bg-accent/10 border border-border/50 dark:border-accent/30"
                                >
                                    <span className="w-2 h-2 rounded-full bg-foreground/70 dark:bg-accent animate-pulse" />
                                    <span className="text-xs font-bold text-foreground/70 dark:text-accent uppercase tracking-wider">
                                        Early Access • {pricingData.progress.current}/{pricingData.progress.total}
                                    </span>
                                </motion.div>
                            )}

                            <div className="space-y-5">
                                {pricingItems.map((item) => (
                                    <motion.div
                                        key={item.size}
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02 }}
                                        className={`relative flex flex-col px-5 sm:px-8 py-5 rounded-2xl bg-surface/30 dark:bg-foreground/5 border-2 transition-colors duration-300 shadow-sm dark:shadow-none ${item.badge
                                            ? 'border-accent/40 dark:border-accent/30 hover:border-accent/60'
                                            : 'border-border/80 dark:border-foreground/10 hover:border-foreground/30 dark:hover:border-accent/40'
                                            }`}
                                    >
                                        {item.badge && (
                                            <span className="absolute -top-3 left-6 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-accent text-background rounded-full flex items-center gap-1.5 shadow-lg shadow-accent/20">
                                                <item.badge.icon size={12} className="shrink-0" />
                                                {item.badge.text}
                                            </span>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-bold text-foreground">{item.size}</span>
                                            <div className="flex items-center gap-3">
                                                {pricingData.isEarlyAccess && (
                                                    <span className="text-lg text-neutral-600 dark:text-neutral-500 line-through">
                                                        {item.futurePrice}
                                                    </span>
                                                )}
                                                <div className="min-w-[4rem] text-right">
                                                    <span className="text-2xl font-black text-foreground/80 dark:text-accent tracking-tight transition-opacity duration-200">
                                                        {item.price}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{item.subtitle}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {pricingData.isEarlyAccess && (
                                <motion.p
                                    variants={itemVariants}
                                    className="mt-6 text-sm text-neutral-600 dark:text-neutral-400 text-center leading-relaxed"
                                >
                                    Early Access pricing applies until 10 commissions are successfully completed.
                                    <br />
                                    Prices increase as demand and availability grow.
                                </motion.p>
                            )}

                            {!pricingData.isEarlyAccess && (
                                <motion.p
                                    variants={itemVariants}
                                    className="mt-6 text-sm text-neutral-600 dark:text-neutral-400 text-center leading-relaxed"
                                >
                                    Early Access has concluded. Current pricing shown above.
                                </motion.p>
                            )}
                        </motion.div>
                    </div>

                    <div className="p-6 sm:p-8 md:p-10 rounded-2xl bg-background dark:bg-foreground/5 border border-border/80 dark:border-foreground/10 shadow-sm dark:shadow-none">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false }}
                            className="h-full flex flex-col"
                        >
                            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-8">Policies</h2>

                            <ul className="flex-1 flex flex-col gap-5 md:gap-0 md:justify-between">
                                {policyItems.map((policy, idx) => (
                                    <motion.li
                                        key={idx}
                                        variants={itemVariants}
                                        className="flex items-start gap-4 text-foreground/80 dark:text-neutral-300 font-medium dark:font-normal"
                                    >
                                        <div className="p-2 rounded-full bg-foreground/5 dark:bg-accent/10 mt-[-2px] border border-border/50 dark:border-transparent">
                                            <policy.icon size={18} className="text-foreground/70 dark:text-accent" />
                                        </div>
                                        <span className="text-sm md:text-base leading-relaxed">{policy.text}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
