'use client';

import { motion } from 'framer-motion';
import { Calendar, Users } from 'lucide-react';

export default function Timeline() {
    return (
        <section className="py-24 px-6 md:px-12 bg-background text-foreground">
            <div className="max-w-4xl mx-auto space-y-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    className="text-center space-y-4"
                >
                    <h2 className="font-serif text-3xl md:text-5xl tracking-wide">Timeline & Availability</h2>
                    <p className="text-neutral-400">Quality takes time. Here&apos;s what to expect.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Card 1 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false }}
                        transition={{ delay: 0.1 }}
                        className="bg-surface border border-foreground/5 p-12 rounded-2xl flex flex-col items-center text-center space-y-6 hover:bg-foreground/5 transition-colors duration-300"
                    >
                        <div className="p-4 bg-accent/10 rounded-full text-accent">
                            <Calendar size={32} strokeWidth={1.5} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-4xl font-serif font-medium">15–30 Days</h3>
                            <p className="text-neutral-500 text-sm uppercase tracking-widest">Per sketch completion time</p>
                        </div>
                    </motion.div>

                    {/* Card 2 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false }}
                        transition={{ delay: 0.2 }}
                        className="bg-surface border border-foreground/5 p-12 rounded-2xl flex flex-col items-center text-center space-y-6 hover:bg-foreground/5 transition-colors duration-300"
                    >
                        <div className="p-4 bg-accent/10 rounded-full text-accent">
                            <Users size={32} strokeWidth={1.5} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-4xl font-serif font-medium">2 Clients</h3>
                            <p className="text-neutral-500 text-sm uppercase tracking-widest">Maximum per month</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
