import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    presetColors?: string[];
}

// Convert Hex to HSV
function hexToHsv(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;

    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, v: v * 100 };
}

// Convert HSV to Hex
function hsvToHex(h: number, s: number, v: number) {
    let r = 0, g = 0, b = 0;
    h /= 360;
    s /= 100;
    v /= 100;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ColorPicker({ color, onChange, presetColors = [] }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hsv, setHsv] = useState(hexToHsv(color));
    const containerRef = useRef<HTMLDivElement>(null);
    const satValAreaRef = useRef<HTMLDivElement>(null);

    // Sync state when prop changes
    useEffect(() => {
        setHsv(hexToHsv(color));
    }, [color]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newH = parseFloat(e.target.value);
        const newColor = hsvToHex(newH, hsv.s, hsv.v);
        onChange(newColor);
    };

    const handleSatValChange = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!satValAreaRef.current) return;

        let clientX, clientY;
        if ('touches' in e) {
            clientX = (e as TouchEvent).touches[0].clientX;
            clientY = (e as TouchEvent).touches[0].clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        const rect = satValAreaRef.current.getBoundingClientRect();

        // Calculate raw position
        let x = clientX - rect.left;
        let y = clientY - rect.top;

        // Constrain to bounds
        x = Math.max(0, Math.min(x, rect.width));
        y = Math.max(0, Math.min(y, rect.height));

        // Calculate saturation (x) and value (y)
        const s = (x / rect.width) * 100;
        const v = 100 - ((y / rect.height) * 100);

        const newColor = hsvToHex(hsv.h, s, v);
        onChange(newColor);
    };

    // Generic drag handler setup
    const useDrag = (handler: (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => void) => {
        const [isDragging, setIsDragging] = useState(false);

        useEffect(() => {
            const onMouseMove = (e: MouseEvent) => isDragging && handler(e);
            const onMouseUp = () => setIsDragging(false);

            const onTouchMove = (e: TouchEvent) => {
                // Prevent scrolling while dragging in the area
                if (isDragging) {
                    e.preventDefault();
                    handler(e);
                }
            };
            const onTouchEnd = () => setIsDragging(false);

            if (isDragging) {
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
                window.addEventListener('touchmove', onTouchMove, { passive: false });
                window.addEventListener('touchend', onTouchEnd);
                window.addEventListener('touchcancel', onTouchEnd);
            }

            return () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                window.removeEventListener('touchmove', onTouchMove);
                window.removeEventListener('touchend', onTouchEnd);
                window.removeEventListener('touchcancel', onTouchEnd);
            };
        }, [isDragging, handler]);

        return {
            onMouseDown: (e: React.MouseEvent) => {
                setIsDragging(true);
                handler(e);
            },
            onTouchStart: (e: React.TouchEvent) => {
                setIsDragging(true);
                handler(e);
            }
        };
    };

    const satValDragHandlers = useDrag(handleSatValChange);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded-full border-2 border-foreground/20 shadow-sm relative overflow-hidden flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-0"
            >
                {/* Checkered background for transparent colors (optional, if you support alpha later) */}
                <div className="absolute inset-0 bg-repeat bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKgAnv37v3/gSgE68CqEKEIpB4a1hE0zQAAXgQIAaQd5WAAAAAASUVORK5CYII=')] z-[-1] opacity-50" />
                <div className="absolute inset-0 z-10" style={{ backgroundColor: color }} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 bg-surface border border-foreground/10 rounded-2xl p-4 shadow-2xl z-50 w-[240px] md:w-[280px]"
                    >
                        {/* Saturation/Value Area */}
                        <div
                            ref={satValAreaRef}
                            className="w-full h-[140px] rounded-lg mb-4 relative cursor-crosshair overflow-hidden touch-none"
                            style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                            {...satValDragHandlers}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black pointer-events-none" />

                            {/* Thumb */}
                            <div
                                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: `${hsv.s}%`,
                                    top: `${100 - hsv.v}%`,
                                    backgroundColor: color
                                }}
                            />
                        </div>

                        {/* Hue Slider */}
                        <div className="mb-4">
                            <input
                                type="range"
                                min="0"
                                max="360"
                                value={hsv.h}
                                onChange={handleHueChange}
                                className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none"
                                style={{
                                    background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
                                }}
                            />
                        </div>

                        {/* Current Color & Presets */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full border border-foreground/20 shrink-0" style={{ backgroundColor: color }} />
                            <div className="flex-1 font-mono text-xs uppercase tracking-wider text-foreground/70">
                                {color}
                            </div>
                        </div>

                        {presetColors.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-foreground/5">
                                {presetColors.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => onChange(preset)}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === preset ? 'border-accent scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: preset }}
                                        title={preset}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Mobile handle to pull down / close */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 md:hidden">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="bg-surface border border-foreground/10 text-foreground/60 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Add these custom styles to your global css later
/*
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 2px solid #ccc;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
*/
