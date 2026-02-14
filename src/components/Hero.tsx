'use client';

import { motion } from 'framer-motion';

export default function Hero() {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="relative h-screen min-h-[600px] flex flex-col justify-center px-6 md:px-12 overflow-hidden">
            {/* Background Graphic or Texture could go here, keeping it minimal dark for now */}

            <div className="max-w-4xl z-10 space-y-8">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="font-serif text-4xl md:text-6xl lg:text-7xl leading-tight tracking-wide text-white"
                >
                    PHOTOREALISTIC <br />
                    <span className="text-white/40">GRAPHITE</span> PORTRAITS
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="max-w-lg text-lg md:text-xl text-neutral-400 font-light"
                >
                    Hyper-realistic pencil sketches created with precision and depth.
                    <span className="block mt-2 text-sm text-neutral-600 uppercase tracking-widest">
                        Available all over India & worldwide
                    </span>
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-6 pt-4"
                >
                    <button
                        onClick={() => scrollToSection('commission-form')}
                        className="group relative px-8 py-4 bg-accent text-background text-sm font-bold uppercase tracking-widest overflow-hidden transition-all hover:bg-white"
                    >
                        Commission a Portrait
                    </button>

                    <button
                        onClick={() => scrollToSection('portfolio')}
                        className="group px-8 py-4 border border-white/20 text-white text-sm font-bold uppercase tracking-widest hover:border-white transition-colors"
                    >
                        View Portfolio
                    </button>
                </motion.div>
            </div>

            {/* Decorative Line */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="absolute bottom-24 left-6 right-6 md:left-12 md:right-12 h-[1px] bg-white/10 origin-left"
            />
        </section>
    );
}
