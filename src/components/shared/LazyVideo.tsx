"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface LazyVideoProps {
    videoSrc?: string;
    videoId?: string;
    thumbnailUrl?: string;
    title: string;
}

export default function LazyVideo({
    videoSrc = "/images/eye%20drawing%20timelapse%20video.mp4",
    thumbnailUrl = "/images/eye%20drawing%20thumbnail.jpg",
    title,
}: LazyVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetHideTimer = useCallback(() => {
        setShowControls(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 2500);
    }, [isPlaying]);

    const handleStart = () => {
        setIsLoaded(true);
        setTimeout(() => {
            videoRef.current?.play();
            setIsPlaying(true);
        }, 100);
    };

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
            setShowControls(true);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
            resetHideTimer();
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
        resetHideTimer();
    };

    const handleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        videoRef.current?.requestFullscreen();
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(isNaN(pct) ? 0 : pct);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        videoRef.current.currentTime = pct * videoRef.current.duration;
        resetHideTimer();
    };

    return (
        <div className="relative w-full h-full group bg-black">
            {!isLoaded ? (
                /* ── Thumbnail Overlay ── */
                <div
                    className="absolute inset-0 cursor-pointer overflow-hidden"
                    onClick={handleStart}
                    onKeyDown={(e) => e.key === "Enter" && handleStart()}
                    role="button"
                    tabIndex={0}
                    aria-label={`Play ${title}`}
                >
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={thumbnailUrl}
                            alt={`Preview for ${title}`}
                            fill
                            className="object-cover opacity-80 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-foreground/90 backdrop-blur-md rounded-full flex items-center justify-center text-background transform group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                            <Play fill="currentColor" size={32} className="ml-1" />
                        </div>
                    </div>
                    <div className="absolute bottom-4 left-5 z-20">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/80">
                            Click to Play Process Video
                        </span>
                    </div>
                </div>
            ) : (
                /* ── Native Video Player (Full Overlay Controls) ── */
                <div
                    className="absolute inset-0 bg-black"
                    onMouseMove={resetHideTimer}
                    onClick={togglePlay}
                >
                    {/* Video element fills the entire space */}
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        className="absolute inset-0 w-full h-full object-contain"
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => { setIsPlaying(false); setShowControls(true); }}
                        poster={thumbnailUrl}
                        playsInline
                    />

                    {/* Controls Overlay — always on top, shown/hidden via opacity */}
                    <div
                        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 pointer-events-none ${showControls || !isPlaying ? "opacity-100" : "opacity-0"}`}
                    >
                        {/* Gradient for readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                        {/* Controls Bar */}
                        <div className="relative z-10 flex flex-col gap-2 px-4 pb-3 pt-8 pointer-events-auto">
                            {/* Progress Bar */}
                            <div
                                className="w-full h-1 bg-white/25 rounded-full cursor-pointer group/bar hover:h-2 transition-all duration-150"
                                onClick={handleSeek}
                            >
                                <div
                                    className="h-full bg-white rounded-full relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity shadow-lg" />
                                </div>
                            </div>

                            {/* Button Row */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={togglePlay}
                                    aria-label={isPlaying ? "Pause" : "Play"}
                                    className="text-white/80 hover:text-white transition-colors p-1"
                                >
                                    {isPlaying
                                        ? <Pause size={18} fill="currentColor" />
                                        : <Play size={18} fill="currentColor" />
                                    }
                                </button>

                                <button
                                    onClick={toggleMute}
                                    aria-label={isMuted ? "Unmute" : "Mute"}
                                    className="text-white/80 hover:text-white transition-colors p-1"
                                >
                                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>

                                <span className="flex-1 text-[10px] uppercase tracking-widest text-white/40 font-medium truncate">
                                    {title}
                                </span>

                                <button
                                    onClick={handleFullscreen}
                                    aria-label="Fullscreen"
                                    className="text-white/80 hover:text-white transition-colors p-1"
                                >
                                    <Maximize size={17} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* YouTube Link Overlay (Always Visible) */}
            <a
                href="https://youtu.be/wgsWB-FK6F0"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute top-4 right-4 z-40 p-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-black/60 transition-all group/yt flex items-center gap-2"
            >
                <svg className="w-5 h-5 fill-red-600 transition-transform group-hover/yt:scale-110" viewBox="0 0 24 24">
                    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                </svg>
                <span className="text-[10px] text-white/90 font-bold uppercase tracking-[0.1em] hidden md:group-hover/yt:block transition-all whitespace-nowrap">
                    Watch on YouTube
                </span>
            </a>
        </div>
    );
}
