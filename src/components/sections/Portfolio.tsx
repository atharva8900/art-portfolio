/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ScanEye } from 'lucide-react';
import { Artwork } from '@/types';
import RevealText from '@/components/shared/RevealText';
import Image from 'next/image';

const MotionImage = motion.create(Image);

export default function Portfolio() {
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
    const [viewMode, setViewMode] = useState<'reference' | 'final'>('final');
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Hardcoded mock data to bypass potential fetch hangs during dev rebuild
        const mockArtworks = [
            {
                id: '1',
                title: 'Andrew Spider-Man',
                category: 'fan_art',
                image_url: '/images/spiderman_andrew_final.jpg',
                reference_image_url: '/images/spiderman_andrew_ref.jpg',
                time_invested: '80+ hours',
                size: 'A3 (38 × 28 cm)',
                category_name: 'Fan Art',
                created_at: new Date().toISOString(),
            },
            {
                id: '2',
                title: 'Mr Bean Portrait',
                category: 'fan_art',
                image_url: '/images/mr_bean_final.jpg',
                reference_image_url: '/images/mr_bean_ref.jpg',
                time_invested: '45+ hours',
                size: 'A3 (40 × 28 cm)',
                category_name: 'Fan Art',
                created_at: new Date().toISOString(),
            },
            {
                id: '3',
                title: 'Tobey Portrait',
                category: 'fan_art',
                image_url: '/images/spiderman_tobey_final.jpg',
                reference_image_url: '/images/spiderman_tobey_ref.jpg',
                time_invested: '18+ hours',
                size: 'A4 (30 × 18 cm)',
                created_at: new Date().toISOString()
            }
        ];

        setArtworks(mockArtworks as Artwork[]);
        setLoading(false);
    }, []);

    const openLightbox = (art: Artwork, mode: 'reference' | 'final') => {
        setSelectedArtwork(art);
        setViewMode(mode);
        const targetUrl = mode === 'final' ? art.image_url : art.reference_image_url;
        if (targetUrl && !loadedImages.has(targetUrl)) {
            setIsImageLoading(true);
        } else {
            setIsImageLoading(false);
        }
    };

    const toggleViewMode = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedArtwork) return;

        const nextMode = viewMode === 'final' ? 'reference' : 'final';
        const nextUrl = nextMode === 'final' ? selectedArtwork.image_url : selectedArtwork.reference_image_url;

        setViewMode(nextMode);

        if (nextUrl && !loadedImages.has(nextUrl)) {
            setIsImageLoading(true);
        } else {
            setIsImageLoading(false);
        }
    };

    const handleImageLoad = () => {
        setIsImageLoading(false);
        if (selectedArtwork) {
            const currentUrl = viewMode === 'final' ? selectedArtwork.image_url : selectedArtwork.reference_image_url;
            if (currentUrl) {
                setLoadedImages(prev => {
                    const newSet = new Set(prev);
                    newSet.add(currentUrl);
                    return newSet;
                });
            }
        }
    };

    return (
        <section id="portfolio" className="py-16 md:py-24 px-6 md:px-12 bg-background min-h-screen">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                    <h2 className="font-serif text-3xl md:text-5xl tracking-widest uppercase">
                        <RevealText>Portfolio</RevealText>
                    </h2>
                    <div className="h-[1px] w-24 bg-foreground/20 mx-auto" />
                </div>

                <div className="text-center space-y-3 pb-4">
                    <h3 className="font-serif text-2xl md:text-3xl text-foreground tracking-wide">
                        <RevealText>A Selection of My Best</RevealText> <RevealText delay={0.3} className="text-neutral-600 dark:text-neutral-400">Hand-Drawn Portraits</RevealText>
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base tracking-wide">
                        <RevealText delay={0.5}>See how a simple reference image becomes a detailed hand-drawn portrait.</RevealText>
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-neutral-600 dark:text-neutral-500" size={32} />
                    </div>
                ) : (

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {artworks.map((art, index) => (
                            <motion.div
                                key={art.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: false }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="flex flex-col space-y-6 pb-12 border-b border-foreground/5 md:border-none md:pb-0"
                            >
                                {/* Card Container */}
                                <div className="group relative bg-surface/30 rounded-3xl overflow-hidden border border-border/40 hover:border-foreground/20 transition-all duration-500 shadow-sm hover:shadow-xl">

                                    {/* Main Image Container (Responsive Aspect Ratio) */}
                                    <div className="relative aspect-[4/5] sm:aspect-[3/4] w-full overflow-hidden cursor-zoom-in">

                                        {/* Original Reference (Hover Layer - Desktop Only) */}
                                        {art.reference_image_url && (
                                            <div className="absolute inset-0 z-0 hidden md:block">
                                                <MotionImage
                                                    src={art.reference_image_url}
                                                    alt={`Reference for ${art.title}`}
                                                    fill
                                                    className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                                <div className="absolute top-4 left-4 z-10 transition-opacity duration-500 opacity-0 group-hover:opacity-100">
                                                    <span className="bg-background/80 backdrop-blur-md text-foreground/90 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-border/50 shadow-sm w-fit">
                                                        Original Photo
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Final Artwork (Base Layer / Default if no reference) */}
                                        <div
                                            className={`absolute inset-0 z-10 ${art.reference_image_url ? 'opacity-100 md:group-hover:opacity-0' : 'opacity-100'} transition-all duration-700 ease-out`}
                                            onClick={() => openLightbox(art, 'final')}
                                        >
                                            <MotionImage
                                                src={art.image_url}
                                                alt={art.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                priority={index <= 2}
                                            />

                                            {/* Final Artwork Label */}
                                            <div className="absolute top-4 left-4 z-20 transition-opacity duration-500 md:group-hover:opacity-0">
                                                <span className="bg-foreground/95 backdrop-blur-md text-background text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                                                    Final Portrait
                                                </span>
                                            </div>

                                            {/* Gradient Overlay for Text Readability at Bottom */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-500" />

                                            {/* Mobile 'Tap to View' Indicator */}
                                            <div className="absolute bottom-4 right-4 z-30 md:hidden pointer-events-none">
                                                <span className="bg-background/80 backdrop-blur-md text-foreground text-[10px] font-medium uppercase tracking-wider px-3 py-2 rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg">
                                                    <ScanEye size={14} />
                                                    Tap to View
                                                </span>
                                            </div>
                                        </div>

                                        {/* Desktop 'View Comparison' Center Button */}
                                        {art.reference_image_url && (
                                            <div className="hidden md:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 z-30 pointer-events-none">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openLightbox(art, 'final'); }}
                                                    className="pointer-events-auto bg-background/90 text-foreground px-6 py-3 rounded-full font-serif tracking-widest text-sm shadow-2xl transform scale-95 group-hover:scale-100 transition-transform duration-500 flex items-center gap-2 border border-border/50 hover:bg-foreground hover:text-background"
                                                >
                                                    <ScanEye size={18} />
                                                    Compare Both
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Details Section */}
                                <div className="space-y-4 px-2 pt-2">
                                    <h3 className="font-serif text-2xl text-foreground tracking-wide group-hover:text-foreground/80 transition-colors">{art.title}</h3>

                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                        {art.time_invested && (
                                            <div className="flex items-center gap-2">
                                                <span className="w-1 h-1 rounded-full bg-accent/50" />
                                                <p className="text-foreground/50 uppercase text-[10px] tracking-widest">{art.time_invested}</p>
                                            </div>
                                        )}
                                        {art.size && (
                                            <div className="flex items-center gap-2">
                                                <span className="w-1 h-1 rounded-full bg-accent/50" />
                                                <p className="text-foreground/50 uppercase text-[10px] tracking-widest">{art.size}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Fallback if no artworks */}
                        {!loading && artworks.length === 0 && (
                            <div className="col-span-full text-center text-neutral-600 dark:text-neutral-500 py-12">
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
                        className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedArtwork(null)}
                    >
                        <button
                            className="absolute top-6 right-6 text-foreground/50 hover:text-foreground transition-colors z-[70]"
                            onClick={() => setSelectedArtwork(null)}
                        >
                            <X size={32} />
                        </button>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="relative max-w-5xl max-h-[95vh] w-full flex flex-col items-center overflow-y-auto no-scrollbar py-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative w-full flex flex-col items-center">
                                {/* Title and Category */}
                                <div className="mb-6 text-center shrink-0">
                                    <h3 className="font-serif text-2xl tracking-wide text-foreground">{selectedArtwork.title}</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-500 uppercase tracking-widest mt-2">{selectedArtwork.category.replace('_', ' ')}</p>
                                </div>

                                <div className="relative w-full flex flex-col items-center justify-center gap-6">
                                    <div className="relative w-full flex justify-center items-center min-h-[40vh]">
                                        {isImageLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                                                <Loader2 className="animate-spin text-foreground/50" size={48} />
                                            </div>
                                        )}

                                        <AnimatePresence mode="wait">
                                            <motion.img
                                                layoutId={`artwork-${selectedArtwork.id}-${viewMode}`}
                                                key={viewMode}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: isImageLoading ? 0 : 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{
                                                    opacity: { duration: 0.2 },
                                                    layout: { type: "spring", stiffness: 300, damping: 30 }
                                                }}
                                                src={viewMode === 'final' ? selectedArtwork.image_url : selectedArtwork.reference_image_url}
                                                alt={selectedArtwork.title}
                                                className="max-h-[58vh] md:max-h-[70vh] w-auto h-auto object-contain shadow-2xl rounded-lg"
                                                onLoad={handleImageLoad}
                                            />
                                        </AnimatePresence>

                                        {/* Badge overlay on the image */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
                                            <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-medium backdrop-blur-md shadow-lg ${viewMode === 'final'
                                                ? 'bg-foreground/90 text-background'
                                                : 'bg-background/60 text-foreground/90 border border-foreground/10'
                                                }`}>
                                                {viewMode === 'final' ? 'Final Artwork' : 'Original Reference'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Toggle Button Container - Increased height for better clearance */}
                                    {selectedArtwork.reference_image_url && (
                                        <div className="flex-none h-16 flex items-center justify-center w-full">
                                            <button
                                                onClick={toggleViewMode}
                                                className="px-6 py-2.5 rounded-full border border-foreground/20 bg-background/50 backdrop-blur-md text-foreground/90 hover:bg-surface transition-all font-serif tracking-wider text-sm flex items-center gap-2 shadow-sm"
                                            >
                                                <span>Show {viewMode === 'final' ? 'Reference Photo' : 'Final Artwork'}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section >
    );
}
