"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import MagneticButton from "./MagneticButton";

export default function Hero() {
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <section
            ref={containerRef}
            id="hero"
            className="relative h-screen min-h-[800px] flex flex-col justify-center items-center overflow-hidden bg-background"
        >
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-10" />
                <motion.div
                    style={{ y, opacity }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800/20 via-background to-background opacity-40"
                />
                {/* Animated Gradient Mesh Effect (approximated with CSS) */}
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-slow-spin bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-[0.03] blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="space-y-2"
                >
                    <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl tracking-tight text-foreground leading-[0.8] mb-2">
                        <span className="block overflow-hidden">
                            <motion.span
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                                className="block"
                            >
                                BEYOND
                            </motion.span>
                        </span>
                        <span className="block overflow-hidden text-foreground/50">
                            <motion.span
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
                                className="block italic"
                            >
                                REALISM
                            </motion.span>
                        </span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="mt-6 max-w-xl text-neutral-600 dark:text-neutral-400 text-lg md:text-xl font-light leading-relaxed text-balance"
                >
                    Preserve your most cherished memories with a handcrafted portrait that captures the soul of the moment.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="mt-10 flex flex-col items-center"
                >
                    <span className="mb-8 text-[10px] md:text-xs uppercase tracking-[0.3em] text-neutral-600 dark:text-neutral-500 font-medium">
                        Available all over India and worldwide
                    </span>

                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                        <MagneticButton
                            onClick={() => scrollToSection("commission-form")}
                            className="px-8 py-4 bg-foreground text-background text-sm font-bold uppercase tracking-widest hover:bg-neutral-200 hover:text-black transition-colors rounded-full"
                        >
                            Commission Now
                        </MagneticButton>

                        <MagneticButton
                            onClick={() => scrollToSection("portfolio")}
                            className="px-8 py-4 border border-foreground/20 text-foreground text-sm font-bold uppercase tracking-widest hover:border-foreground transition-colors rounded-full backdrop-blur-sm"
                        >
                            View Artworks
                        </MagneticButton>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-[10px] uppercase tracking-widest text-neutral-600 dark:text-neutral-500">Scroll</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-neutral-600 dark:from-neutral-500 to-transparent" />
            </motion.div>
        </section>
    );
}
