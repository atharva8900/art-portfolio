'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Artwork } from '@/types';

export default function Portfolio() {
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

    useEffect(() => {
        async function fetchArtworks() {
            try {
                const res = await fetch('/api/artworks');
                if (res.ok) {
                    const data = await res.json();
                    setArtworks(data);
                }
            } catch (error) {
                console.error('Failed to fetch artworks', error);
            } finally {
                setLoading(false);
            }
        }
        fetchArtworks();
    }, []);

    return (
        <section id="portfolio" className="py-24 px-6 md:px-12 bg-background min-h-screen">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                    <h2 className="font-serif text-3xl md:text-5xl tracking-widest uppercase">Selected Works</h2>
                    <div className="h-[1px] w-24 bg-white/20 mx-auto" />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-neutral-500" size={32} />
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {artworks.map((art, index) => (
                            <motion.div
                                key={art.id}
                                layoutId={`artwork-${art.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                onClick={() => setSelectedArtwork(art)}
                                className="break-inside-avoid relative group cursor-zoom-in overflow-hidden bg-neutral-900"
                            >
                                <img
                                    src={art.image_url}
                                    alt={art.title}
                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                            </motion.div>
                        ))}

                        {/* Fallback if no artworks */}
                        {!loading && artworks.length === 0 && (
                            <div className="col-span-full text-center text-neutral-500 py-12">
                                <p>No artworks uploaded yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedArtwork && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedArtwork(null)}
                    >
                        <button
                            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                            onClick={() => setSelectedArtwork(null)}
                        >
                            <X size={32} />
                        </button>

                        <motion.div
                            layoutId={`artwork-${selectedArtwork.id}`}
                            className="relative max-w-5xl max-h-[90vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedArtwork.image_url}
                                alt={selectedArtwork.title}
                                className="w-full h-full object-contain max-h-[85vh]"
                            />
                            <div className="mt-4 text-center">
                                <h3 className="font-serif text-xl tracking-wide text-white">{selectedArtwork.title}</h3>
                                <p className="text-sm text-neutral-500 uppercase tracking-widest mt-1">{selectedArtwork.category.replace('_', ' ')}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
