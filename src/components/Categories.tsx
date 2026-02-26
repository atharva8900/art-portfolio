'use client';

import { motion } from 'framer-motion';
import { Palette, Heart, Users } from 'lucide-react';

const categories = [
    {
        id: 'fan-art',
        title: 'Fan Art',
        description: 'Photorealistic hand-drawn portraits of cricketers, actors, footballers, anime characters, singers, and other popular personalities, created with high accuracy and strong likeness.',
        icon: Palette
    },
    {
        id: 'religious-art',
        title: 'Religious Art',
        description: 'Detailed hand-drawn artworks of any god, goddess, or spiritual figure, focusing on devotion, expression, and fine detailing.',
        icon: Heart
    },
    {
        id: 'personal-portraits',
        title: 'Personal Portraits',
        description: 'Custom hand-drawn portraits including self portraits, friends, relatives, families, couples, pets, cousins, and more. Ideal for birthdays, anniversaries, special occasions, and meaningful gifts for loved ones.',
        icon: Users
    }
];

export default function Categories() {
    return (
        <section id="categories" className="py-24 px-6 md:px-12 bg-surface text-foreground">
            <div className="max-w-7xl mx-auto space-y-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-4 opacity-0"
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
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-background p-8 rounded-2xl border border-foreground/5 hover:border-accent/20 hover:bg-background/80 transition-colors duration-300 group opacity-0 shadow-sm"
                        >
                            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform duration-300">
                                <cat.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-4">{cat.title}</h3>
                            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm md:text-base">
                                {cat.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
