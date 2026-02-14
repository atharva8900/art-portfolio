'use client';

import { motion } from 'framer-motion';

export default function Pricing() {
    const sizes = [
        { name: 'A5', price: '₹500', dim: '14.8 x 21 cm' },
        { name: 'A4', price: '₹1000', dim: '21 x 29.7 cm' },
        { name: 'A3', price: '₹2000', dim: '29.7 x 42 cm' },
    ];

    return (
        <section id="pricing" className="py-24 px-6 md:px-12 bg-surface text-foreground">
            <div className="max-w-4xl mx-auto space-y-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center space-y-4"
                >
                    <h2 className="font-serif text-3xl md:text-5xl tracking-widest uppercase">Commission Rates</h2>
                    <div className="h-[1px] w-24 bg-white/20 mx-auto" />
                    <p className="text-neutral-400">Invest in a timeless memory. Prices are per person.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {sizes.map((size, idx) => (
                        <motion.div
                            key={size.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="border border-white/5 p-8 flex flex-col items-center text-center hover:bg-white/5 transition-colors duration-300"
                        >
                            <h3 className="text-5xl font-serif mb-2">{size.name}</h3>
                            <p className="text-neutral-500 text-sm mb-6 uppercase tracking-widest">{size.dim}</p>
                            <div className="text-4xl font-light text-accent mb-2">{size.price}</div>
                            <p className="text-neutral-600 text-xs">Base Price / Person</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="bg-neutral-900/50 p-8 border-l-2 border-accent space-y-4 text-neutral-400 text-sm md:text-base"
                >
                    <h4 className="text-white font-medium uppercase tracking-widest mb-4">Important Details</h4>
                    <ul className="space-y-2 list-disc list-inside marker:text-accent">
                        <li><strong>Additional Persons:</strong> Charged at the same base price per person.</li>
                        <li><strong>Detailed Background:</strong> +₹500 flat fee.</li>
                        <li><strong>Payment:</strong> 50% advance required to confirm booking.</li>
                        <li><strong>Timeline:</strong> 15–30 days depending on complexity.</li>
                        <li><strong>Shipping:</strong> Framing & delivery charges apply additionally.</li>
                    </ul>
                </motion.div>
            </div>
        </section>
    );
}
