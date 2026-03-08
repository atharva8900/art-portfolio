'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

const faqs = [
    {
        question: "How does the waitlist work?",
        answer: "When main slots are full, you can reserve a spot with a **25% non-refundable fee**. When a slot opens, I'll notify you to pay the remaining 25% (total 50% deposit) to start work."
    },
    {
        question: "How long does a portrait take?",
        answer: "Typically **2-4 weeks** depending on size (A5/A4/A3) and complexity. I'll provide a specific estimate when your commission is accepted."
    },
    {
        question: "What payment methods are accepted?",
        answer: "I use **Razorpay**, which supports UPI, Bank Transfers, Credit/Debit cards, and other online payment options."
    },
    {
        question: "Do you ship internationally?",
        answer: "Yes! I ship **all over India and worldwide**. Shipping costs are calculated based on your **location and the weight** of the parcel."
    },
    {
        question: "Can I see progress updates?",
        answer: "Yes, I send a **rough sketch for approval** before starting the final rendering. I upload it in your **commission dashboard** where you can access it and track your order status."
    },
    {
        question: "What kind of photo should I provide?",
        answer: "High-resolution photos with **clear lighting and visible facial features** work best. Avoid blurry or heavily filtered images."
    },
    {
        question: "Is the deposit refundable?",
        answer: (
            <span>
                Your initial payment is <strong>100% refundable if cancelled within 48 hours</strong>. After that period, or once work has begun, it becomes non-refundable as it secures materials and dedicated time. Please <Link href="/legal/refund-policy" className="text-secondary dark:text-accent font-medium underline underline-offset-4 hover:text-foreground transition-colors">read our full refund policy</Link> for more details.
            </span>
        )
    }
];

export default function FAQ() {
    const [isOpen, setIsOpen] = useState(false);
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-24 px-6 md:px-12 bg-background">
            <div className="max-w-3xl mx-auto">
                {/* Toggle Button */}
                <div className="flex justify-center">
                    <motion.button
                        onClick={() => setIsOpen(!isOpen)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-3 px-8 py-3 rounded-full border transition-all duration-300 ${isOpen
                            ? 'bg-accent text-background border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]'
                            : 'bg-surface text-foreground border-foreground/10 hover:border-accent/50'
                            }`}
                    >
                        <HelpCircle size={18} />
                        <span className="font-medium tracking-wide">Read FAQs & Guidelines</span>
                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChevronDown size={18} />
                        </motion.div>
                    </motion.button>
                </div>

                {/* FAQ Content Drawer */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="mt-8 pt-8 border-t border-foreground/5 space-y-4">
                                {faqs.map((faq, idx) => {
                                    const isItemOpen = openIndex === idx;
                                    return (
                                        <div key={idx} className="border-b border-foreground/5 last:border-0 pb-4">
                                            <button
                                                onClick={() => setOpenIndex(isItemOpen ? null : idx)}
                                                className="w-full flex items-center justify-between py-4 text-left transition-colors hover:text-accent"
                                            >
                                                <h3 className={`text-lg font-serif italic transition-colors ${isItemOpen ? 'text-accent' : 'text-foreground/90'}`}>
                                                    {faq.question}
                                                </h3>
                                                <div className={`shrink-0 ml-4 transition-colors ${isItemOpen ? 'text-accent' : 'text-neutral-500'}`}>
                                                    {isItemOpen ? <Minus size={18} /> : <Plus size={18} />}
                                                </div>
                                            </button>
                                            <AnimatePresence>
                                                {isItemOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-sm md:text-base pb-4 pr-8">
                                                            {typeof faq.answer === 'string' ? (
                                                                <p dangerouslySetInnerHTML={{ __html: faq.answer.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground dark:text-neutral-200">$1</strong>') }} />
                                                            ) : (
                                                                faq.answer
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}

                                <div className="pt-12 text-center">
                                    <p className="text-xs text-neutral-500 uppercase tracking-widest">
                                        Still have questions?{' '}
                                        <button
                                            onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                                            className="text-secondary dark:text-accent font-bold hover:underline focus:outline-none"
                                        >
                                            Start a chat
                                        </button>{' '}
                                        or DM on Instagram.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
