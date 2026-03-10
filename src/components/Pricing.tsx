'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, CreditCard, ImageIcon, Package, Globe, ShieldCheck } from 'lucide-react';

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

// 1. Static Variants (Outside component to prevent re-triggering logic)
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1
        }
    }
};

const cardVariants = {
    hidden: {
        opacity: 0,
        y: 40,
        rotate: -2,
        scale: 0.95
    },
    visible: {
        opacity: 1,
        y: 0,
        rotate: 0,
        scale: 1,
        transition: {
            type: "spring",
            damping: 20,
            stiffness: 100
        }
    }
};

const policyVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
};

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
                clearTimeout(timeoutId);
                setPricingData(data);
            })
            .catch(err => {
                clearTimeout(timeoutId);
                if (err.name !== 'AbortError') {
                    console.error('Failed to fetch pricing tier:', err);
                }
            });

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, []);

    const futurePrices = {
        A5: '₹750',
        A4: '₹1500',
        A3: '₹3000',
    };

    const pricingItems = useMemo(() => [
        { size: 'A5' as const, price: pricingData.prices.A5, futurePrice: futurePrices.A5, subtitle: 'Perfect for tabletops & small spaces', badge: null },
        { size: 'A4' as const, price: pricingData.prices.A4, futurePrice: futurePrices.A4, subtitle: 'Best for couple portraits & fanart', badge: '🌟 Most Popular' },
        { size: 'A3' as const, price: pricingData.prices.A3, futurePrice: futurePrices.A3, subtitle: 'Maximum detail & group portraits', badge: '💎 Grand Portrait' }
    ], [pricingData.prices]);

    const policyItems = useMemo(() => [
        { icon: Users, text: "Group Portraits: A4 & A3 get 50% off for every additional face. A5 charged at base price per person." },
        { icon: CreditCard, text: "50% advance to confirm. Waitlist reservations: 25% to hold your spot" },
        { icon: ImageIcon, text: "Detailed background: +₹500" },
        { icon: Package, text: "Framing & delivery charges apply" },
        { icon: ShieldCheck, text: "All artworks are packed & shipped with care" },
        { icon: Globe, text: "Available all over India & worldwide" }
    ], []);

    return (
        <section id="pricing" className="py-24 px-6 md:px-12 bg-surface text-foreground overflow-hidden">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, margin: "-100px" }}
                    variants={policyVariants}
                    className="text-center mb-16"
                >
                    <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">Commission Details</h2>
                    <p className="text-neutral-400 text-lg">Transparent pricing and clear policies for your custom portrait.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
                    {/* Left Column: Pricing Cards */}
                    <div className="rounded-2xl bg-background dark:bg-foreground/5 border border-border/80 dark:border-foreground/10 p-6 sm:p-8 md:p-10 shadow-sm dark:shadow-none">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false }}
                            variants={containerVariants}
                        >
                            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-8">Portrait Pricing</h2>

                            {pricingData.isEarlyAccess && (
                                <motion.div
                                    variants={cardVariants}
                                    className="mb-8 p-4 rounded-xl bg-foreground/5 dark:bg-accent/5 border border-border/50 dark:border-accent/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-2.5 h-2.5 rounded-full bg-foreground/70 dark:bg-accent animate-pulse shadow-[0_0_10px_rgba(var(--accent),0.5)]" />
                                        <span className="text-xs font-bold text-foreground/70 dark:text-accent uppercase tracking-[0.2em]">
                                            Early Access • {pricingData.progress.current}/{pricingData.progress.total}
                                        </span>
                                    </div>
                                </motion.div>
                            )}

                            <div className="space-y-6">
                                {pricingItems.map((item) => (
                                    <motion.div
                                        key={item.size}
                                        variants={cardVariants}
                                        whileHover={{ y: -5, scale: 1.01, transition: { duration: 0.2 } }}
                                        className={`relative group flex flex-col px-6 sm:px-8 py-6 rounded-2xl bg-surface/30 dark:bg-foreground/5 border-2 transition-colors duration-300 ${item.badge
                                            ? 'border-accent/40 dark:border-accent/30 hover:border-accent/60'
                                            : 'border-border/80 dark:border-foreground/10 hover:border-foreground/30 dark:hover:border-accent/40'
                                            }`}
                                    >
                                        {item.badge && (
                                            <span className="absolute -top-3 left-6 px-4 py-1 text-[10px] font-bold uppercase tracking-widest bg-accent text-background rounded-full shadow-lg shadow-accent/20">
                                                {item.badge}
                                            </span>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-bold text-foreground/90 group-hover:text-foreground transition-colors">{item.size}</span>
                                            <div className="flex items-center gap-3">
                                                {pricingData.isEarlyAccess && (
                                                    <span className="text-sm text-neutral-500 line-through opacity-70">
                                                        {item.futurePrice}
                                                    </span>
                                                )}
                                                <span className="text-2xl font-black text-foreground/80 dark:text-accent tracking-tight transition-all duration-500">
                                                    {item.price}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 italic group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
                                            {item.subtitle}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.p
                                variants={cardVariants}
                                className="mt-10 text-xs text-neutral-500 dark:text-neutral-400 text-center leading-relaxed"
                            >
                                {pricingData.isEarlyAccess
                                    ? "Early Access pricing applies until initial slots are filled. Prices will then adjust to market value."
                                    : "Early Access has concluded. Standard industry rates now apply."}
                            </motion.p>
                        </motion.div>
                    </div>

                    {/* Right Column: Policies */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, margin: "-50px" }}
                        variants={containerVariants}
                        className="p-6 sm:p-8 md:p-10 rounded-2xl bg-background dark:bg-foreground/5 border border-border/80 dark:border-foreground/10 h-full"
                    >
                        <motion.h2 variants={policyVariants} className="font-serif text-3xl md:text-4xl text-foreground mb-8">Policies</motion.h2>

                        <div className="space-y-8">
                            {policyItems.map((policy, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={policyVariants}
                                    className="flex items-start gap-4 group"
                                >
                                    <div className="p-3 rounded-xl bg-foreground/5 dark:bg-accent/10 border border-border/50 dark:border-transparent group-hover:scale-110 transition-transform">
                                        <policy.icon size={20} className="text-foreground/70 dark:text-accent" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm md:text-base text-foreground/80 dark:text-neutral-300 leading-relaxed font-medium">
                                            {policy.text}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            variants={policyVariants}
                            className="mt-12 pt-8 border-t border-border/50 dark:border-foreground/10 text-center"
                        >
                            <p className="text-sm text-neutral-500 italic">"Quality takes time. Thank you for your patience."</p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
