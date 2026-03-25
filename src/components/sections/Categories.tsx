'use client';

import { motion } from 'framer-motion';
import { Palette, Heart, Users } from 'lucide-react';
import { GlowCard } from '@/components/ui/spotlight-card';

const categories = [
    {
        id: 'fan-art',
        title: 'Fan Art',
        description: 'Photorealistic hand-drawn portraits of cricketers, actors, footballers, anime characters, singers, and other popular personalities, created with high accuracy and strong likeness.',
        icon: Palette,
        glowColor: 'purple' as const
    },
    {
        id: 'religious-art',
        title: 'Religious Art',
        description: 'Detailed hand-drawn artworks of any god, goddess, or spiritual figure, focusing on devotion, expression, and fine detailing.',
        icon: Heart,
        glowColor: 'orange' as const
    },
    {
        id: 'personal-portraits',
        title: 'Personal Portraits',
        description: 'Custom hand-drawn portraits including self portraits, friends, relatives, families, couples, pets, cousins, and more. Ideal for birthdays, anniversaries, special occasions, and meaningful gifts for loved ones.',
        icon: Users,
        glowColor: 'blue' as const
    }
];

export default function Categories() {
    return (
        <section id="categories" className="py-24 px-6 md:px-12 bg-surface text-foreground">
            <div className="max-w-7xl mx-auto space-y-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    className="space-y-4"
                >
                    <h2 className="font-serif text-3xl md:text-5xl tracking-widest uppercase">Categories</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl">Explore the different types of portraits available for commission.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {categories.map((cat, idx) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.2 }}
                            transition={{ delay: idx * 0.1 }}
                            className="h-full transition-transform duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1"
                        >
                            <GlowCard className="h-full" glowColor={cat.glowColor}>
                                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform duration-300">
                                    <cat.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-4">{cat.title}</h3>
                                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm md:text-base">
                                    {cat.description}
                                </p>
                            </GlowCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
