"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Info, Calendar, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
    {
        number: "01",
        title: "Fill Out the Commission Form",
        description:
            "Everything starts with a short form on the homepage. You'll choose your paper size (A5, A4, or A3), the number of people in the portrait, and any add-ons you'd like — such as a detailed background, a timelapse recording of the drawing process, or custom framing. You can also upload up to 6 reference photos directly in the form, so I can see exactly what you have in mind.",
        note: "You'll need to sign in with Google or your email to submit. This keeps your commission tied to your account and lets you track it later in your Client Dashboard.",
    },
    {
        number: "02",
        title: "Under Review",
        description:
            "Once your form is submitted, your commission enters the review queue. I personally go through every request and check the reference photos, size, and details to make sure I can deliver the quality you deserve. This stage usually takes 1–3 days.",
        note: "You can check the status of your commission anytime by logging in and visiting your Client Dashboard.",
    },
    {
        number: "03",
        title: "Slot Confirmed — Deposit to Begin",
        description:
            "If your slot is accepted, you'll receive an email notification and a secure Razorpay payment link in your dashboard for the 50% deposit. Once the deposit is received, work officially begins. If I'm fully booked, your request automatically enters the Waitlist (see below).",
        note: "You have a 48-hour cancellation window after paying the deposit. After that, the deposit is non-refundable as work has already started.",
    },
    {
        number: "03b",
        title: "Waitlist (If Slots Are Full)",
        description:
            "If my immediate slots are full, you can still secure your place by paying a 25% waitlist reservation fee. This holds your spot in the queue. When a slot opens up, your request moves to 'Accepted' and you'll be asked to pay the remaining 25% deposit to begin the artwork.",
        note: "Waitlist positions are filled strictly in order. The reservation fee is applied toward your total.",
        isAlternate: true,
    },
    {
        number: "04",
        title: "Artwork in Progress",
        description:
            "This is where the magic happens. I work on your portrait carefully and at my own pace to ensure the best quality — typically 15 to 30 days for completion. As the artwork progresses, I'll upload three work-in-progress snapshots to your Client Dashboard: the initial outlines, a mid-process photo, and the finished artwork. You can view and download these at any time.",
        note: "If you opted for a timelapse, the video recording will be shared with you once the artwork is complete.",
    },
    {
        number: "05",
        title: "Artwork Ready — Final Payment",
        description:
            "Once the portrait is complete, the status in your dashboard changes to 'Artwork Ready'. At this point, I'll calculate the shipping cost based on your location and generate a final payment link for the remaining 50% balance plus shipping. The artwork will not be shipped until the final payment is received.",
        note: "Shipping is handled via trusted couriers including DTDC, DHL, and India Post, depending on your location.",
    },
    {
        number: "06",
        title: "Shipped & On Its Way",
        description:
            "Once your final payment is confirmed, the artwork is carefully packed and handed over to the courier. The status in your dashboard updates to 'Shipped'. Depending on your location, delivery typically takes 3–10 business days for domestic orders and longer for international shipments.",
        note: "I'll let you know as soon as your portrait is handed over to the courier. I appreciate your patience while it makes its way to you!",
    },
    {
        number: "07",
        title: "Delivered — Your Art is Home",
        description:
            "When your artwork arrives, please let me know — I love hearing that it reached you safely! The commission is then marked as 'Delivered' in your dashboard and archived in your history. You can also download a detailed invoice from your dashboard for your records at any time.",
        note: "If you opted for framing, the artwork arrives in a custom frame, ready to hang.",
    },
];

export default function CommissionProcessPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-[#e5e5e5] pt-16 md:pt-32 pb-16 md:pb-24 selection:bg-[#e7bb55]/30 selection:text-[#e7bb55]">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-[#e7bb55]/60 hover:text-[#e7bb55] transition-all mb-12 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                </motion.div>

                {/* Header */}
                <div className="mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <p className="text-[10px] text-[#e7bb55] uppercase tracking-[0.4em] font-bold mb-4">
                            The Journey
                        </p>
                        <h1 className="text-5xl md:text-7xl font-serif mb-8 leading-tight text-white">
                            The Commission <span className="text-[#e7bb55]">Process</span>
                        </h1>
                        <p className="text-neutral-400 text-xl leading-relaxed max-w-2xl font-light italic">
                            &ldquo;Commissioning a custom portrait is a personal and exciting experience. Here&apos;s a
                            detailed look at every step — from the moment you fill out the form to the day your
                            artwork arrives at your door.&rdquo;
                        </p>
                    </motion.div>
                </div>

                {/* Slot System Explanation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-24 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[#e7bb55]/[0.02] border border-[#e7bb55]/20 rounded-[2.5rem]" />
                    <div className="absolute top-0 right-0 py-8 px-12 opacity-5">
                        <Calendar size={120} className="text-[#e7bb55]" />
                    </div>
                    
                    <div className="relative p-10 md:p-14">
                        <h2 className="text-2xl font-serif text-[#e7bb55] mb-6 flex items-center gap-3">
                            <Sparkles size={20} className="shrink-0" />
                            Understanding the Slot System
                        </h2>
                        <div className="space-y-6 text-neutral-300 text-lg leading-relaxed font-light">
                            <p>
                                To ensure every portrait receives the time and detail it deserves, I only work on <strong className="text-white font-semibold">2 active commissions per month</strong>. This allows me to focus completely on the unique features and character of each subject.
                            </p>
                            <p>
                                My total capacity is capped at <strong className="text-white font-semibold">4 slots</strong>: 2 for immediate work and 2 for waitlist reservations. If all immediate slots are filled, you can still reserve your place for the next available month via the waitlist.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Steps Section Title */}
                <div className="mb-12 flex items-center gap-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#e7bb55]/20 to-transparent" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold whitespace-nowrap">Step-by-Step Breakdown</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#e7bb55]/20 to-transparent" />
                </div>

                {/* Timeline Steps */}
                <ol className="relative space-y-0">
                    {/* Vertical line with gradient */}
                    <div className="absolute left-[23px] top-6 bottom-6 w-px bg-gradient-to-b from-[#e7bb55]/40 via-[#e7bb55]/10 to-[#e7bb55]/40 hidden sm:block" />

                    {steps.map((step, i) => (
                        <motion.li 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="relative sm:pl-20 pb-16 last:pb-0"
                        >
                            {/* Step number bubble */}
                            <div className="hidden sm:flex absolute left-0 top-0.5 w-12 h-12 rounded-full border border-[#e7bb55]/30 bg-[#050505] items-center justify-center z-10 shadow-[0_0_20px_rgba(231,187,85,0.1)] group-hover:border-[#e7bb55] transition-colors">
                                <span className={`text-[11px] font-bold tracking-wider ${step.isAlternate ? "text-amber-500" : "text-[#e7bb55]"}`}>
                                    {step.number}
                                </span>
                            </div>

                            {/* Content Card */}
                            <div
                                className={`group relative rounded-[2rem] border transition-all duration-500 p-8 md:p-12 ${
                                    step.isAlternate
                                        ? "border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.04] hover:border-amber-500/40"
                                        : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10"
                                } shadow-xl`}
                            >
                                {step.isAlternate && (
                                    <div className="flex items-center gap-2 mb-4">
                                         <span className="inline-block text-[9px] font-bold uppercase tracking-[0.2em] text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                                            If Slots Full
                                        </span>
                                    </div>
                                )}
                                
                                {/* Mobile step badge */}
                                <span className="sm:hidden inline-block text-[9px] font-bold uppercase tracking-[0.2em] text-[#e7bb55] bg-[#e7bb55]/5 px-3 py-1 rounded-full border border-[#e7bb55]/20 mb-4">
                                    Step {step.number}
                                </span>

                                <h2 className="text-2xl md:text-3xl font-serif text-white mb-6 group-hover:text-[#e7bb55] transition-colors">
                                    {step.title}
                                </h2>
                                
                                <p className="text-neutral-400 text-lg leading-relaxed mb-8 font-light">
                                    {step.description}
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl group-hover:border-[#e7bb55]/20 group-hover:bg-[#e7bb55]/[0.01] transition-all">
                                        <Info size={18} className="text-[#e7bb55] shrink-0 mt-0.5 opacity-60" />
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-widest text-[#e7bb55]/60 font-bold">Important Note</p>
                                            <p className="text-sm text-neutral-500 leading-relaxed font-light italic">
                                                {step.note}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.li>
                    ))}
                </ol>

                {/* CTA at bottom */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-24 pt-16 border-t border-white/10 text-center"
                >
                    <p className="text-neutral-500 mb-10 text-xl font-light italic">
                        Ready to start your journey?
                    </p>
                    <Link
                        href="/#commission-form"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-[#e7bb55] text-black font-bold rounded-2xl hover:bg-[#d4a94a] transition-all group shadow-[0_10px_40px_rgba(231,187,85,0.2)]"
                    >
                        <span className="text-sm uppercase tracking-[0.25em]">Commission a Portrait</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
