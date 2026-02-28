'use client';

import { motion } from 'framer-motion';
import RevealText from './RevealText';

export default function About() {
    return (
        <section id="about" className="py-24 px-6 md:px-12 bg-surface text-foreground">
            <div className="max-w-6xl mx-auto">
                <div className="bg-background border border-foreground/5 rounded-[2rem] p-6 sm:p-10 md:p-16 flex flex-col md:flex-row gap-12 md:gap-24 items-center shadow-sm">
                    {/* Text Content */}
                    <div className="flex-1 space-y-8">
                        <h2 className="font-serif text-3xl md:text-5xl tracking-wide uppercase">
                            <RevealText>About the</RevealText> <br />
                            <RevealText className="text-neutral-600 dark:text-neutral-500" delay={0.2}>Artist</RevealText>
                        </h2>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="space-y-6 text-neutral-600 dark:text-neutral-400 text-lg font-light leading-relaxed"
                        >
                            <p>
                                I specialize in <strong className="text-foreground font-medium">photorealistic and hyper-realistic hand-drawn portraits</strong>.
                                My work is defined by an obsession with detail—capturing not just the likeness, but the texture of skin, the depth of eyes, and the subtle interplay of light and shadow.
                            </p>
                            <p>
                                Using the <strong className="text-foreground font-medium">Grid Method</strong> for absolute precision, I ensure that every proportion is mathematically accurate before shading begins. This technique allows me to achieve a level of realism that transforms a simple sketch into a lifelike memory.
                            </p>
                            <p>
                                To maintain this standard of quality, I accept only <strong className="text-foreground font-medium">limited commissions per month</strong>. Each piece is a labor of love, requiring days of focused dedication.
                            </p>
                        </motion.div>
                    </div>

                    {/* Image/Visual - Using a placeholder div or an img if we had one. 
            For now, a stylistic frame or empty frame to represent the artist's workspace or portrait. */}
                    {/* Process Card */}
                    <div className="flex-1 w-full bg-surface border border-foreground/5 rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col space-y-6 md:space-y-8">
                        {/* Card Header */}
                        <div className="text-center space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                <h3 className="font-serif text-2xl tracking-widest uppercase text-foreground">The Process</h3>
                                <div className="h-[1px] w-12 bg-foreground/20 mx-auto mt-3" />
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base font-light italic"
                            >
                                &ldquo;Watch how a blank paper comes to life with each stroke of a pencil.&rdquo;
                            </motion.p>
                        </div>

                        {/* Video Container */}
                        <div
                            className="w-full aspect-video bg-background border border-neutral-800 rounded-xl overflow-hidden shadow-2xl relative group"
                            onMouseEnter={() => window.dispatchEvent(new Event('cursor-hide'))}
                            onMouseLeave={() => window.dispatchEvent(new Event('cursor-show'))}
                            data-hide-cursor="true"
                        >
                            <iframe
                                width="100%"
                                height="100%"
                                src="https://www.youtube.com/embed/wgsWB-FK6F0?si=qgJUgCsv96ukowa2&rel=0"
                                title="Realistic Eye Drawing Timelapse"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>

                        {/* Card Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="text-center"
                        >
                            <p className="text-xs text-neutral-600 dark:text-neutral-500 uppercase tracking-widest">
                                Hand-Drawn with Graphite on Paper
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section >
    );
}
