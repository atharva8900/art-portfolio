'use client';

import { motion } from 'framer-motion';

export default function Process() {
    return (
        <section className="py-24 px-6 md:px-12 bg-surface overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col items-center space-y-12">
                <div className="text-center space-y-4 max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="font-serif text-3xl md:text-5xl tracking-widest uppercase text-foreground">The Process</h2>
                        <div className="h-[1px] w-24 bg-foreground/20 mx-auto mt-4" />
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-neutral-400 text-lg md:text-xl font-light italic"
                    >
                        &ldquo;Watch how a blank paper comes to life with each stroke of a pencil.&rdquo;
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border border-foreground/10 shadow-2xl bg-background"
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
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-center"
                >
                    <p className="text-sm text-neutral-500 uppercase tracking-widest">
                        Hand-Drawn with Graphite on Paper
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
