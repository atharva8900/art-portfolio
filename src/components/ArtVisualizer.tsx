'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    Maximize2,
    Frame,
    Settings2,
    Trash2,
    LayoutTemplate,
    Expand,
    Minimize,
    RefreshCcw
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { ColorPicker } from './ui/ColorPicker';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

type FrameStyle = 'minimal-black' | 'classic-wood' | 'premium-gold' | 'sleek-white';
type PortraitSize = 'A5' | 'A4' | 'A3';
type Orientation = 'portrait' | 'landscape';

const SAMPLE_IMAGE = "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1000&auto=format&fit=crop";

export interface FrameConfig {
    size: PortraitSize;
    orientation: Orientation;
    frameStyle: FrameStyle;
    mattingColor: string;
    mattingSize: number;
    frameWidth: number;
    image?: string | null;
    /** Rendered DOM snapshot of the framed artwork (JPEG DataURL) */
    frameSnapshot?: string | null;
}

interface ArtVisualizerProps {
    /** When true, renders as a compact embedded view (no section wrapper, no outer heading) */
    embedded?: boolean;
    /** Passed from the parent form to pre-fill the selected size */
    forcedSize?: PortraitSize;
    /** Passed from the parent form to remember previously saved selections */
    initialConfig?: FrameConfig;
    /** Called when user clicks "Frame It" — passes the current config */
    onFrameIt?: (config: FrameConfig) => void;
    /** Optional class name to pass down */
    className?: string;
}

const ArtVisualizer = ({ embedded = false, forcedSize, initialConfig, onFrameIt, className = '' }: ArtVisualizerProps) => {
    const [image, setImage] = useState<string | null>(initialConfig?.image || null);
    const [size, setSize] = useState<PortraitSize>(initialConfig?.size || forcedSize || 'A4');
    const [orientation, setOrientation] = useState<Orientation>(initialConfig?.orientation || 'portrait');
    const [frameStyle, setFrameStyle] = useState<FrameStyle>(initialConfig?.frameStyle || 'minimal-black');
    const [mattingSize, setMattingSize] = useState(initialConfig?.mattingSize || 40);
    const [mattingColor, setMattingColor] = useState(initialConfig?.mattingColor || '#f5f5f4');
    const [frameWidth, setFrameWidth] = useState(initialConfig?.frameWidth || 20);
    const [frameItState, setFrameItState] = useState<'idle' | 'capturing' | 'done'>('idle');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isImageTransformed, setIsImageTransformed] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const transformRef = useRef<ReactZoomPanPinchRef>(null);
    const previewAreaRef = useRef<HTMLDivElement>(null);

    const [wrapperSize, setWrapperSize] = useState({ w: 0, h: 0 });
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

    useEffect(() => {
        if (!previewAreaRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setWrapperSize({ w: width, h: height });
            }
        });
        observer.observe(previewAreaRef.current);
        return () => observer.disconnect();
    }, []);

    let contentW: string | number = '100%';
    let contentH: string | number = '100%';

    if (wrapperSize.w > 0 && wrapperSize.h > 0 && imgSize.w > 0 && imgSize.h > 0) {
        const wrapperAspect = wrapperSize.w / wrapperSize.h;
        const imgAspect = imgSize.w / imgSize.h;

        if (imgAspect > wrapperAspect) {
            // Image is wider than container
            contentH = Math.ceil(wrapperSize.h);
            contentW = Math.ceil(wrapperSize.h * imgAspect);
        } else {
            // Image is taller than container
            contentW = Math.ceil(wrapperSize.w);
            contentH = Math.ceil(wrapperSize.w / imgAspect);
        }
    }


    // Re-sync state if the initialConfig or forcedSize changes from parent form
    useEffect(() => {
        if (initialConfig) {
            setSize(initialConfig.size);
            setOrientation(initialConfig.orientation || 'portrait');
            setFrameStyle(initialConfig.frameStyle);
            setMattingSize(initialConfig.mattingSize);
            setMattingColor(initialConfig.mattingColor);
            setFrameWidth(initialConfig.frameWidth);
            if (initialConfig.image) setImage(initialConfig.image);
        } else if (forcedSize) {
            setSize(forcedSize);
        }
    }, [initialConfig, forcedSize]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetImage = () => {
        setImage(null);
        setIsImageTransformed(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const resetImageTransform = useCallback(() => {
        transformRef.current?.resetTransform(0);
        transformRef.current?.centerView(1, 0);
        setIsImageTransformed(false);
    }, []);

    // Explicitly center the image whenever the container or image metadata changes
    useEffect(() => {
        if (wrapperSize.w > 0 && wrapperSize.h > 0 && imgSize.w > 0 && imgSize.h > 0) {
            // Give the library a tiny frame to digest the new content dimensions
            const timer = setTimeout(() => {
                transformRef.current?.centerView(1, 0);
                setIsImageTransformed(false);
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [wrapperSize.w, wrapperSize.h, imgSize.w, imgSize.h, orientation, image]);

    const getFrameStyles = () => {
        switch (frameStyle) {
            case 'minimal-black':
                return 'border-zinc-800 bg-zinc-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8),0_0_1px_1px_rgba(255,255,255,0.1)]';
            case 'classic-wood':
                return 'border-[#5D4037] bg-[#5D4037] shadow-2xl';
            case 'premium-gold':
                return 'border-[#D4AF37] bg-[#D4AF37] shadow-2xl';
            case 'sleek-white':
                return 'border-stone-100 bg-stone-100 shadow-2xl';
            default:
                return 'border-zinc-900 bg-zinc-900';
        }
    };

    const toggleFullscreen = () => {
        const element = document.getElementById('visualizer-container');
        if (!element) return;

        if (!document.fullscreenElement) {
            element.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handleFrameIt = async () => {
        let frameSnapshot: string | null = null;
        if (image && previewRef.current) {
            try {
                setFrameItState('capturing');
                const rect = previewRef.current.getBoundingClientRect();
                frameSnapshot = await htmlToImage.toJpeg(previewRef.current, {
                    quality: 0.92,
                    pixelRatio: 2,
                    width: rect.width,
                    height: rect.height,
                    skipFonts: true,
                    style: {
                        transform: 'none',
                        overflow: 'visible',
                    }
                });

            } catch (err) {
                console.warn('Frame snapshot failed, falling back to raw image', err);
            }
        }
        const config: FrameConfig = { size, orientation, frameStyle, mattingColor, mattingSize, frameWidth, image, frameSnapshot };
        if (onFrameIt) {
            onFrameIt(config);
        }
        setFrameItState('done');
        setTimeout(() => setFrameItState('idle'), 3000);
    };

    const content = (
        <div className={`${embedded ? 'max-w-5xl mx-auto' : 'max-w-7xl mx-auto'} ${className}`}>
            {!embedded && (
                <div className="text-center mb-16 space-y-4">
                    <h2 className="font-serif text-3xl md:text-5xl tracking-widest uppercase text-foreground">
                        Art Studio <span className="text-accent">Visualizer</span>
                    </h2>
                    <p className="text-foreground/60 max-w-2xl mx-auto text-lg">
                        Preview your own photo as a custom graphite portrait. Customize the frame and matting to see exactly how your finished piece will look.
                    </p>
                </div>
            )}

            <div id="visualizer-container" className="flex flex-col lg:grid lg:grid-cols-12 gap-0 lg:gap-8 h-full items-stretch overflow-hidden bg-background">
                {/* Preview Area - locked top half on mobile, natural on desktop */}
                <div className="lg:col-span-8 w-full shrink-0 flex-grow min-h-[45%] lg:h-full flex flex-col items-center justify-center gap-4 relative bg-surface/50 lg:overflow-y-auto lg:py-8 lg:px-4">
                    {/* Fullscreen Toggle Button */}
                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-4 left-4 z-30 p-3 rounded-xl bg-background/80 backdrop-blur-md border border-foreground/10 text-foreground/60 shadow-lg active:scale-95 transition-all lg:hidden"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize size={20} /> : <Expand size={20} />}
                    </button>

                    <div className={`relative w-full h-auto flex-grow flex items-center justify-center ${orientation === 'portrait' ? 'aspect-[2/3] lg:max-h-[500px]' : 'aspect-[3/2] lg:max-h-[420px]'} max-h-full rounded-2xl lg:rounded-3xl overflow-hidden p-3 lg:p-8 bg-surface transition-all duration-500`}>
                        <AnimatePresence mode="wait">
                            {!image ? (
                                <motion.div
                                    key="uploader"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full max-w-md md:aspect-[3/4] py-6 md:py-0 border-2 border-dashed border-foreground/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-all duration-300 group"
                                >
                                    <div className="p-3 md:p-4 rounded-full bg-foreground/5 group-hover:scale-110 transition-transform duration-300">
                                        <Upload className="text-foreground/40 group-hover:text-accent w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-foreground/80">Upload Reference Photo</p>
                                        <p className="text-xs text-foreground/40 mt-1 uppercase tracking-widest">PNG, JPG up to 10MB</p>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-4">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setImage(SAMPLE_IMAGE);
                                            }}
                                            className="text-[10px] uppercase tracking-widest font-bold text-accent hover:underline"
                                        >
                                            Or Use Sample Artwork
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="preview-box"
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative flex items-center justify-center"
                                    style={{
                                        height: orientation === 'portrait' ? '85%' : 'auto',
                                        width: orientation === 'landscape' ? '85%' : 'auto',
                                        minWidth: '200px',
                                        aspectRatio: orientation === 'portrait' ? '2/3' : '3/2',
                                    }}
                                >
                                    <div
                                        ref={previewRef}
                                        className={`w-full h-full relative p-[2px] transition-all duration-300 ${getFrameStyles()}`}
                                        style={{ padding: `${frameWidth}px` }}>
                                        {/* Matting (Inner Border) */}
                                        <div
                                            className="w-full h-full relative transition-all duration-300 shadow-inner flex items-center justify-center"
                                            style={{ padding: `${mattingSize}px`, backgroundColor: mattingColor }}
                                        >
                                            {/* The "Artwork" — zoomable/pannable */}
                                            <div ref={previewAreaRef} className="w-full h-full relative overflow-hidden shadow-sm touch-none">
                                                <TransformWrapper
                                                    key={`${orientation}-${image}-${Math.round(wrapperSize.w)}-${Math.round(wrapperSize.h)}-${Math.round(imgSize.w)}-${Math.round(imgSize.h)}`}
                                                    ref={transformRef}
                                                    initialScale={1}
                                                    minScale={1}
                                                    maxScale={5}
                                                    limitToBounds={true}
                                                    onTransformed={(_, state) => {
                                                        const isTransformed = state.scale !== 1 || Math.abs(state.positionX) > 1 || Math.abs(state.positionY) > 1;
                                                        setIsImageTransformed(isTransformed);
                                                    }}
                                                    wheel={{ step: 0.1 }}
                                                    pinch={{ step: 5 }}
                                                >
                                                    <TransformComponent
                                                        wrapperStyle={{ width: '100%', height: '100%' }}
                                                        contentStyle={{
                                                            width: typeof contentW === 'number' ? `${contentW}px` : contentW,
                                                            height: typeof contentH === 'number' ? `${contentH}px` : contentH
                                                        }}
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={image}
                                                            alt="Portrait preview"
                                                            className="select-none block"
                                                            style={{
                                                                filter: 'grayscale(100%) contrast(1.15) brightness(1.05)',
                                                                width: typeof contentW === 'number' ? `${contentW}px` : '100%',
                                                                height: typeof contentH === 'number' ? `${contentH}px` : '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                            onLoad={(e) => setImgSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                                                            draggable={false}
                                                        />
                                                    </TransformComponent>
                                                </TransformWrapper>
                                                {/* Graphite Texture Overlay */}
                                                <div className="absolute inset-0 bg-repeat opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }} />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            resetImage();
                                        }}
                                        className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-all hover:scale-110 active:scale-95 z-40"
                                        title="Clear image"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Reset View Button - Fixed at bottom right of container */}
                        {image && isImageTransformed && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    resetImageTransform();
                                }}
                                className="absolute bottom-4 right-4 text-[10px] uppercase tracking-[0.2em] font-bold px-6 py-3 rounded-full bg-foreground text-background shadow-2xl hover:bg-accent hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 border border-background/10 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
                            >
                                <RefreshCcw size={12} /> Reset View
                            </button>
                        )}
                    </div>

                    {/* Interaction Hint - Back to stable Footer area below frame */}
                    {image && (
                        <div className="flex flex-col items-center py-4 w-full h-[60px] shrink-0">
                            <div className="text-[10px] uppercase tracking-[0.15em] text-foreground/40 font-bold flex flex-wrap items-center gap-4 justify-center px-4">
                                <span className="flex items-center gap-1.5"><Expand size={12} /> Pinch / Scroll to Zoom</span>
                                <span className="hidden sm:block w-1 h-1 rounded-full bg-foreground/20" />
                                <span className="flex items-center gap-1.5"><Maximize2 size={12} /> Drag to Reposition</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Drawer - scrollable bottom sheet on mobile, sidebar on desktop */}
                <div className="lg:col-span-4 flex-1 h-full lg:h-full min-h-0 bg-surface border-t-0 lg:border lg:border-foreground/5 rounded-t-3xl lg:rounded-3xl lg:self-stretch shadow-[0_-8px_30px_rgba(0,0,0,0.4)] lg:shadow-sm flex flex-col">
                    {/* Pill handle — mobile only */}
                    <div className="flex justify-center pt-3 pb-1 lg:hidden">
                        <div className="w-10 h-1 rounded-full bg-foreground/20" />
                    </div>
                    {/* Sticky header — not part of the scroll area */}
                    <div className="flex items-center gap-3 text-accent border-b border-foreground/5 px-4 lg:px-6 py-3">
                        <Settings2 size={16} />
                        <h3 className="font-serif text-sm lg:text-xl tracking-widest uppercase">Design Studio</h3>
                    </div>
                    {/* Scrollable controls area */}
                    <div className="flex-1 overflow-y-scroll overscroll-contain custom-scrollbar p-4 lg:p-6 space-y-5" onWheel={(e) => e.stopPropagation()}>

                        {!forcedSize && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Maximize2 size={16} className="text-foreground/40" />
                                    <label className="text-xs uppercase tracking-widest text-foreground/60 font-bold">Paper Size</label>
                                </div>
                                <div className="flex gap-2">
                                    {(['A5', 'A4', 'A3'] as PortraitSize[]).map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setSize(s)}
                                            className={`flex-1 py-3 rounded-xl border transition-all duration-200 uppercase font-bold text-xs tracking-tighter ${size === s
                                                ? 'bg-foreground text-background border-foreground active:scale-95'
                                                : 'border-foreground/10 text-foreground/40 hover:border-foreground/30 hover:text-foreground'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Orientation Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <LayoutTemplate size={16} className="text-foreground/40" />
                                <label className="text-xs uppercase tracking-widest text-foreground/60 font-bold">Orientation</label>
                            </div>
                            <div className="flex gap-2">
                                {(['portrait', 'landscape'] as Orientation[]).map((o) => (
                                    <button
                                        key={o}
                                        type="button"
                                        onClick={() => setOrientation(o)}
                                        className={`flex-1 py-3 rounded-xl border transition-all duration-200 uppercase font-bold text-xs tracking-tighter ${orientation === o
                                            ? 'bg-foreground text-background border-foreground active:scale-95'
                                            : 'border-foreground/10 text-foreground/40 hover:border-foreground/30 hover:text-foreground'
                                            }`}
                                    >
                                        {o}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Frame Style Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Frame size={16} className="text-foreground/40" />
                                <label className="text-xs uppercase tracking-widest text-foreground/60 font-bold">Frame Style</label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'minimal-black', name: 'Ink Black', color: 'bg-zinc-900' },
                                    { id: 'classic-wood', name: 'Oak Wood', color: 'bg-[#5D4037]' },
                                    { id: 'premium-gold', name: 'Vintage Gold', color: 'bg-[#D4AF37]' },
                                    { id: 'sleek-white', name: 'Cloud White', color: 'bg-stone-100 border border-black/5' },
                                ].map((style) => (
                                    <button
                                        key={style.id}
                                        type="button"
                                        onClick={() => setFrameStyle(style.id as FrameStyle)}
                                        className={`p-3 rounded-xl border transition-all duration-200 flex items-center gap-3 ${frameStyle === style.id
                                            ? 'border-accent bg-accent/5 active:scale-95'
                                            : 'border-foreground/10 hover:border-foreground/20'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full ${style.color}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-tight ${frameStyle === style.id ? 'text-accent' : 'text-foreground/60'}`}>
                                            {style.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Matting Controls */}
                        <div className="space-y-3 pt-3 border-t border-foreground/5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs uppercase tracking-widest text-foreground/60 font-bold">Inner Matting</label>
                                <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">{mattingSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="80"
                                value={mattingSize}
                                onChange={(e) => setMattingSize(parseInt(e.target.value))}
                                className="w-full accent-accent h-1 bg-foreground/10 rounded-lg appearance-none cursor-pointer"
                            />

                            {/* Matting Color swatches */}
                            <div className="flex flex-wrap gap-2">
                                {['#f5f5f4', '#ffffff', '#000000', '#3c2f2f', '#d2b48c', '#800000', '#2f4f4f'].map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setMattingColor(c)}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${mattingColor === c ? 'border-accent scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                        title={c}
                                    />
                                ))}
                                {/* Custom Color Picker — sits in the same row as swatches */}
                                <ColorPicker
                                    color={mattingColor}
                                    onChange={setMattingColor}
                                    presetColors={['#f5f5f4', '#ffffff', '#000000', '#3c2f2f', '#d2b48c', '#800000', '#2f4f4f']}
                                />
                            </div>
                        </div>

                        {/* Frame Width */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs uppercase tracking-widest text-foreground/60 font-bold">Frame Width</label>
                                <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">{frameWidth}px</span>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="40"
                                value={frameWidth}
                                onChange={(e) => setFrameWidth(parseInt(e.target.value))}
                                className="w-full accent-accent h-1 bg-foreground/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                    </div>


                    {/* CTA — sticky at the bottom of the sidebar */}
                    <div className="p-4 lg:p-6 pt-3 border-t border-foreground/5 shrink-0">
                        <button
                            type="button"
                            onClick={handleFrameIt}
                            className={`w-full py-4 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 ${frameItState === 'done'
                                ? 'bg-emerald-500 text-white'
                                : frameItState === 'capturing'
                                    ? 'bg-accent/60 text-background cursor-wait'
                                    : 'bg-accent text-background hover:opacity-90'
                                }`}
                        >
                            {frameItState === 'done' ? '✓ Frame Saved!' : frameItState === 'capturing' ? 'Capturing…' : (initialConfig ? 'Update Frame' : 'Frame It')}
                        </button>
                        {embedded ? (
                            <p className="text-[10px] text-foreground/40 text-center mt-2 uppercase tracking-widest">
                                Your frame preferences will be included with your order
                            </p>
                        ) : (
                            <p className="text-[10px] text-foreground/40 text-center mt-2 uppercase tracking-widest">
                                Your frame preferences will be sent with your commission request
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );

    if (embedded) {
        return <div className={`w-full h-full flex flex-col ${className}`}>{content}</div>;
    }

    return (
        <section id="visualizer" className="py-24 px-6 md:px-12 bg-background relative overflow-hidden">
            {content}
        </section>
    );
};

export default ArtVisualizer;
