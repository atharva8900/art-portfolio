"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, ShieldCheck, Sparkles, Truck, Package, Frame, Flame, HeartHandshake, CheckCircle2, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function RushFeePage() {
    return (
        <div className="min-h-screen bg-background text-foreground pt-16 md:pt-32 pb-16 md:pb-24 selection:bg-[#e7bb55]/30 selection:text-[#e7bb55]">
            <div className="max-w-4xl mx-auto px-6">
                {/* Back button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-[#e7bb55]/70 hover:text-[#e7bb55] transition-all mb-10 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                </motion.div>

                {/* Header Section */}
                <div className="mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold tracking-wide uppercase mb-5">
                            <Flame size={14} className="animate-pulse" />
                            Behind the Schedule
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-5 leading-tight">
                            Why I Charge a Rush Fee & How My 7-Day Buffer Works
                        </h1>
                        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
                            A transparent, honest look at why to guarantee delivery by your date, drawing must finish 7 days earlier, and what happens behind the easel when you book a rush order.
                        </p>
                    </motion.div>
                </div>

                {/* The Core Truth Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-6 sm:p-8 rounded-2xl bg-surface border border-foreground/10 shadow-sm relative overflow-hidden mb-16"
                >
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
                            <Calendar size={26} />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">
                                To guarantee delivery by your date, drawing must finish 7 days earlier.
                            </h2>
                            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                When you pick a target date on my calendar for a birthday, anniversary, or special event, my promise is that your portrait reaches your hands <strong>on or before that exact day</strong>.
                            </p>
                            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                Because of that promise, I create a separate internal deadline for myself: <strong>I subtract 7 days from your target deadline</strong>. Those final 7 days are strictly reserved for post-creation care, framing, protective packaging, and courier transit.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* The 7-Day Buffer Timeline */}
                <div className="mb-20 space-y-8">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-[#e7bb55]">Step-by-Step Breakdown</span>
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mt-1">
                            Where Do Those 7 Days Go?
                        </h2>
                        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2">
                            Unlike digital files that can be emailed instantly, handcrafted realistic artwork requires careful physical handling:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Buffer Step 1 */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-foreground/10 hover:border-foreground/20 transition-all flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-foreground/5 text-foreground/70">Days 1 – 3</span>
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                        <Frame size={20} />
                                    </div>
                                </div>
                                <h3 className="font-serif font-bold text-lg text-foreground mb-2">
                                    Framing
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    Finalizing your chosen frame style and custom-fitting your portrait (if framed).
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-foreground/5 text-xs text-neutral-500">
                                Picking your frame options and getting your custom frame ready.
                            </div>
                        </div>

                        {/* Buffer Step 2 */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-foreground/10 hover:border-foreground/20 transition-all flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-foreground/5 text-foreground/70">Day 4</span>
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                        <Package size={20} />
                                    </div>
                                </div>
                                <h3 className="font-serif font-bold text-lg text-foreground mb-2">
                                    Packaging
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    Packed securely with protective padding to ensure safe doorstep delivery.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-foreground/5 text-xs text-neutral-500">
                                Zero bent corners or transit damage.
                            </div>
                        </div>

                        {/* Buffer Step 3 */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-foreground/10 hover:border-foreground/20 transition-all flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-foreground/5 text-foreground/70">Days 5 – 7</span>
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                        <Truck size={20} />
                                    </div>
                                </div>
                                <h3 className="font-serif font-bold text-lg text-foreground mb-2">
                                    Express Courier & Safety Margin
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    Handed over to priority tracked couriers (DTDC, DHL, India Post).
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-foreground/5 text-xs text-neutral-500">
                                Guaranteed on-time arrival for your event.
                            </div>
                        </div>
                    </div>
                </div>

                {/* What Happens When You Select a Rush Date */}
                <div className="mb-20 p-8 sm:p-10 rounded-2xl bg-surface border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-transparent relative">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
                            <Clock size={36} />
                        </div>
                        <div className="space-y-4">
                            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                                Behind the Easel
                            </div>
                            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                                Why Does a Rush Order Require a 30% Fee?
                            </h2>
                            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                Because the <strong>7-day buffer is non-negotiable</strong> (framing and couriers take the same amount of time no matter what), choosing an earlier date doesn&apos;t speed up delivery: <strong>it directly shrinks my drawing time</strong>.
                            </p>
                            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                A hyper-realistic portrait takes anywhere from <strong>20 to 45+ hours</strong> of hyper-focused pencil work. I refuse to compromise on quality or deliver rushed, sketchy work.
                            </p>
                            <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 text-sm text-foreground space-y-2">
                                <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                    <Sparkles size={16} /> How I make your tight deadline work:
                                </div>
                                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                    I work whole-day overtime, waking up early in the morning and drawing continuously until night to pour those same 30+ hours of detailed artwork into a condensed few days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visual Timeline Comparison */}
                <div className="mb-20 space-y-6">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-[#e7bb55]">Timeline Comparison</span>
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mt-1">
                            Standard Schedule vs. Rush Schedule
                        </h2>
                        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2">
                            Example: Ordering an <strong>A4 Portrait</strong> on <strong>May 1</strong> (same 30+ hours of detail, same 7-day buffer).
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Standard Schedule Bar (21 Days = 2/3 Drawing + 1/3 Buffer) */}
                        <div className="p-5 rounded-xl bg-surface border border-foreground/10 space-y-3">
                            <div className="flex flex-wrap justify-between items-center gap-2 text-sm font-semibold">
                                <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 size={16} /> Standard Timeline: 21 Days (Arrives May 22+)
                                </span>
                                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                                    Standard Pace (No Rush Fee)
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-center">
                                <div className="sm:col-span-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-lg flex flex-col items-center justify-center px-3 py-2.5">
                                    <span className="font-semibold">🎨 Regular Drawing (14 Days)</span>
                                    <span className="text-[11px] opacity-80 mt-0.5">May 1 - May 14</span>
                                </div>
                                <div className="sm:col-span-1 bg-neutral-500/10 dark:bg-neutral-500/15 border border-foreground/10 text-neutral-700 dark:text-neutral-300 rounded-lg flex flex-col items-center justify-center px-3 py-2.5">
                                    <span className="font-semibold">📦 7-Day Buffer</span>
                                    <span className="text-[11px] opacity-80 mt-0.5">Framing &amp; Shipping (May 15 - May 21)</span>
                                </div>
                            </div>
                        </div>

                        {/* Rush Schedule Bar (14 Days = 1/3 Overtime Drawing + 1/3 Buffer + 1/3 Saved Time) */}
                        <div className="p-5 rounded-xl bg-surface border border-amber-500/30 space-y-3">
                            <div className="flex flex-wrap justify-between items-center gap-2 text-sm font-semibold">
                                <span className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                    <Flame size={16} /> Rush Timeline: 14 Days (Arrives May 15)
                                </span>
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                                    +30% Rush Fee
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-center">
                                <div className="sm:col-span-1 bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 rounded-lg flex flex-col items-center justify-center px-3 py-2.5">
                                    <span className="font-bold">⚡ Overtime Drawing (7 Days)</span>
                                    <span className="text-[11px] opacity-85 mt-0.5">May 1 - May 7</span>
                                </div>
                                <div className="sm:col-span-1 bg-neutral-500/10 dark:bg-neutral-500/15 border border-foreground/10 text-neutral-700 dark:text-neutral-300 rounded-lg flex flex-col items-center justify-center px-3 py-2.5">
                                    <span className="font-semibold">📦 7-Day Buffer</span>
                                    <span className="text-[11px] opacity-80 mt-0.5">Framing &amp; Shipping (May 8 - May 14)</span>
                                </div>
                                <div className="sm:col-span-1 border border-dashed border-amber-500/35 bg-amber-500/[0.04] text-amber-700 dark:text-amber-300 rounded-lg flex flex-col items-center justify-center px-3 py-2.5">
                                    <span className="font-semibold">✨ Delivered 1 Week Earlier</span>
                                    <span className="text-[11px] opacity-80 mt-0.5">In your hands on May 15</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Shown using an A4 portrait as an example. Exact timelines scale by paper size (A5, A4, A3, A2) on the booking calendar.
                    </p>
                </div>

                {/* What You Get with a Rush Order */}
                <div className="mb-20">
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-6">
                        My Commitment to You
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 rounded-xl bg-surface border border-foreground/10 flex items-start gap-3.5">
                            <ShieldCheck className="text-[#e7bb55] shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">Zero Compromise on Quality</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                                    Every single hair, eye reflection, and fine texture receives the exact same dedicated attention to detail.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-surface border border-foreground/10 flex items-start gap-3.5">
                            <Clock className="text-[#e7bb55] shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">Priority Queue Bump</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                                    Your portrait jumps straight to the top of my priority list and becomes my immediate focus.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-surface border border-foreground/10 flex items-start gap-3.5">
                            <HeartHandshake className="text-[#e7bb55] shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">Full Progress Transparency</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                                    You still get your 3 WIP snapshots uploaded to your Client Dashboard so you see the art take life.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-surface border border-foreground/10 flex items-start gap-3.5">
                            <Truck className="text-[#e7bb55] shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">Guaranteed Target Arrival</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                                    I track the package every step of the way until it is safely in your hands before your deadline.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call to Action Footer */}
                <div className="p-8 sm:p-12 rounded-3xl bg-surface border border-foreground/10 text-center space-y-6">
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                        Ready to Bring Your Portrait to Life?
                    </h2>
                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
                        Check my calendar for available dates, pick your size and customizations, and let&apos;s create a timeless piece together.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                        <Link
                            href="/#commission"
                            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#e7bb55] text-black font-semibold text-sm hover:bg-[#d8ab43] transition-colors shadow-sm flex items-center justify-center gap-2 group"
                        >
                            Book a Commission
                            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <Link
                            href="/commission-process"
                            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground font-medium text-sm transition-colors"
                        >
                            View Step-by-Step Process
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
