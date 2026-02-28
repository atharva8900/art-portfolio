'use client';

import React from 'react';
import { Instagram } from 'lucide-react';

const CommissionCTA = () => {
    return (
        <section className="py-16 px-6 bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="bg-surface border border-foreground/5 dark:border-white/5 rounded-3xl p-6 sm:p-10 md:p-16 text-center space-y-6 md:space-y-8 shadow-sm">
                    <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-foreground tracking-wide max-w-2xl mx-auto leading-relaxed uppercase px-2">
                        &ldquo;Turn your images into a hand-drawn realistic portrait&rdquo;
                    </h3>

                    <div className="flex flex-col items-center gap-6 mt-4">
                        <button
                            onClick={() => document.getElementById('commission-form')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-foreground text-background px-6 md:px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-neutral-200 hover:text-black transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 duration-200 text-sm md:text-base w-full max-w-[280px] sm:w-auto"
                        >
                            Commission Now
                        </button>

                        <a
                            href="https://www.instagram.com/atharva_sherlekar_art/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 hover:text-foreground transition-colors border-b border-transparent hover:border-foreground/50 pb-1 group text-center"
                        >
                            <Instagram size={14} className="shrink-0" />
                            <span className="leading-snug">See more of my artwork on Instagram</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CommissionCTA;
