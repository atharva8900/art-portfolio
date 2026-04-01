'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Quote, Heart, Sparkles, Instagram } from 'lucide-react';

const TESTIMONIALS = [
    {
        name: "Namrata Paste",
        role: "Buyer",
        content: "Exceptional work 🙌 This sketch is beyond what I imagined. You brought so much life and emotion to it—Thank you so much ❤️",
        avatar: "N",
        color: "amber",
        icon: Quote,
        instagramUrl: "https://www.instagram.com/p/DSCH4LZjY6C/?igsh=bGZvdWFhMXIxd2gy"
    },
    {
        name: "Shubham Paste",
        role: "The Recipient",
        content: "You've created something unforgettable. The detailing, the effort — everything is perfect. Truly grateful for this masterpiece. ❤️🔥🙌",
        avatar: "S",
        color: "accent",
        icon: Sparkles,
        instagramUrl: "https://www.instagram.com/p/DSCH4LZjY6C/?igsh=bGZvdWFhMXIxd2gy"
    }
];

const Testimonials = () => {
    return (
        <section className="py-16 md:py-24 bg-background overflow-hidden border-t border-foreground/5" id="testimonials">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="font-serif text-3xl md:text-5xl tracking-widest uppercase text-foreground">
                        Previous Client Reviews
                    </h2>
                    <div className="h-[1px] w-24 bg-foreground/20 mx-auto" />
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Main Photo - Photo of recipient holding sketch */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full lg:w-2/5 relative flex justify-center"
                    >
                        <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-foreground/5 bg-surface max-w-sm">
                            <Image
                                src="/images/testimonial_1.jpg"
                                alt="Happy client holding their custom graphite sketch"
                                width={800}
                                height={1000}
                                className="w-full h-auto object-cover scale-105 hover:scale-100 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                                <p className="text-white text-sm font-medium tracking-wide">A moment captured: Birthday gift surprise.</p>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl -z-10" />
                        <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-amber-500/5 rounded-full blur-3xl -z-10" />
                    </motion.div>

                    {/* Testimonials Side */}
                    <div className="w-full lg:w-1/2 space-y-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false }}
                            transition={{ duration: 0.6 }}
                            className="space-y-4"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-widest">
                                <Heart size={12} className="fill-current" />
                                Featured Story
                            </div>
                            <h2 className="text-3xl md:text-5xl font-serif text-foreground leading-tight italic">
                                Give gift to your loved ones on <span className="text-accent not-italic">special occasion</span>
                            </h2>
                            <p className="text-foreground/60 text-lg max-w-lg">
                                This was a beautiful birthday gift planned by Namrata Paste for Shubham Paste on his special day.
                            </p>
                        </motion.div>

                        <div className="space-y-8">
                            {TESTIMONIALS.map((testimonial, index) => {
                                // Explicitly define classes so Tailwind can detect them
                                const themeStyles = testimonial.color === 'amber'
                                    ? {
                                        cardHover: "hover:border-amber-500/30",
                                        iconBase: "text-amber-500/20",
                                        iconHover: "group-hover:text-amber-500/40",
                                        avatarBg: "bg-amber-500/20",
                                        avatarText: "text-amber-500"
                                    }
                                    : {
                                        cardHover: "hover:border-accent/30",
                                        iconBase: "text-accent/20",
                                        iconHover: "group-hover:text-accent/40",
                                        avatarBg: "bg-accent/20",
                                        avatarText: "text-accent"
                                    };

                                return (
                                    <motion.div
                                        key={testimonial.name}
                                        initial={{ opacity: 0, x: 30 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: false }}
                                        transition={{ duration: 0.6, delay: 0.2 * (index + 1) }}
                                        className={`relative p-8 rounded-2xl bg-surface border border-foreground/5 shadow-sm group transition-colors ${themeStyles.cardHover}`}
                                    >
                                        <testimonial.icon className={`absolute -top-4 -left-4 w-12 h-12 transition-colors ${themeStyles.iconBase} ${themeStyles.iconHover}`} />
                                        <p className="text-lg text-foreground/80 mb-6 italic leading-relaxed">
                                            &quot;{testimonial.content}&quot;
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${themeStyles.avatarBg} ${themeStyles.avatarText}`}>
                                                    {testimonial.avatar}
                                                </div>
                                                <div>
                                                    <h4 className="text-foreground font-bold">{testimonial.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-foreground/40 text-xs uppercase tracking-tighter">{testimonial.role}</p>
                                                        {testimonial.instagramUrl && (
                                                            <a
                                                                href={testimonial.instagramUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-foreground/40 hover:text-[#E4405F] transition-colors p-1"
                                                                title="View on Instagram"
                                                            >
                                                                <Instagram size={14} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Testimonials;
