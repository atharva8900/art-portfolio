'use client';

import { motion } from 'framer-motion';

export default function About() {
    return (
        <section id="about" className="py-24 px-6 md:px-12 bg-surface text-foreground">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 md:gap-24 items-center">
                {/* Text Content */}
                <div className="flex-1 space-y-8">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="font-serif text-3xl md:text-5xl tracking-wide uppercase"
                    >
                        The Art of <br /><span className="text-neutral-500">Realism</span>
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="space-y-6 text-neutral-400 text-lg font-light leading-relaxed"
                    >
                        <p>
                            I specialize in <strong className="text-white font-medium">photorealistic and hyper-realistic graphite pencil portraits</strong>.
                            My work is defined by an obsession with detail—capturing not just the likeness, but the texture of skin, the depth of eyes, and the subtle interplay of light and shadow.
                        </p>
                        <p>
                            Using the <strong className="text-white font-medium">Grid Method</strong> for absolute precision, I ensure that every proportion is mathematically accurate before shading begins. This technique allows me to achieve a level of realism that transforms a simple sketch into a lifelike memory.
                        </p>
                        <p>
                            To maintain this standard of quality, I accept only <strong className="text-white font-medium">limited commissions per month</strong>. Each piece is a labor of love, requiring days of focused dedication.
                        </p>
                    </motion.div>
                </div>

                {/* Image/Visual - Using a placeholder div or an img if we had one. 
            For now, a stylistic frame or empty frame to represent the artist's workspace or portrait. */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="flex-1 w-full aspect-[3/4] md:aspect-square bg-neutral-900 border border-neutral-800 flex items-center justify-center relative overflow-hidden group"
                >
                    {/* Placeholder for Artist Image */}
                    <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
                    <span className="relative z-10 text-neutral-600 font-serif tracking-widest uppercase text-sm">Artist Portrait</span>
                </motion.div>
            </div>
        </section>
    );
}
