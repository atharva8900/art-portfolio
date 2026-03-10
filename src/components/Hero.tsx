"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MagneticButton from "./MagneticButton";
import GrainOverlay from "./GrainOverlay";

// Register locally to be safe against bundle order
if (typeof window !== "undefined") {
    gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);
    const bgContainerRef = useRef<HTMLDivElement>(null);

    // Refs for Entrance Animation
    const beyondLoadRef = useRef<HTMLSpanElement>(null);
    const realismLoadRef = useRef<HTMLSpanElement>(null);
    const descriptionLoadRef = useRef<HTMLParagraphElement>(null);
    const ctaLoadRef = useRef<HTMLDivElement>(null);

    // Refs for Scroll Animation (wrappers to prevent GSAP conflicts)
    const beyondScrollRef = useRef<HTMLSpanElement>(null);
    const realismScrollRef = useRef<HTMLSpanElement>(null);
    const lowerContentScrollRef = useRef<HTMLDivElement>(null);
    const scrollIndicatorRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // --- 1. Entrance Animation (The Bloom) ---
        // These target the inner elements.
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from(beyondLoadRef.current, { yPercent: 100, opacity: 0, duration: 1.2, delay: 0.1 })
            .from(realismLoadRef.current, { yPercent: 100, opacity: 0, duration: 1.2 }, "-=0.9")
            .from(descriptionLoadRef.current, { opacity: 0, y: 20, duration: 1.2 }, "-=0.8")
            .from(ctaLoadRef.current, { opacity: 0, y: 20, duration: 1.2 }, "-=1.0");

        // --- 2. The "Gate" Scroll Animation ---
        // These target the OUTER wrapper elements. By separating the targets,
        // ScrollTrigger won't accidentally record the initial opacity=0 from the load animation.
        const mm = gsap.matchMedia();

        mm.add("(min-width: 768px)", () => {
            const scrollTl = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top top",
                    end: "bottom top", // Match exact height of section
                    pin: true,
                    pinSpacing: false, // Prevents empty space; next section scrolls up underneath
                    scrub: 1,
                },
            });

            // The "Pull Focus" opening
            scrollTl
                .to(beyondScrollRef.current, { filter: "blur(20px)", opacity: 0, scale: 0.9, duration: 0.8 }, 0)
                .to(realismScrollRef.current, { filter: "blur(20px)", opacity: 0, scale: 0.9, duration: 0.8 }, 0)
                .to(lowerContentScrollRef.current, { filter: "blur(20px)", opacity: 0, y: 50, duration: 0.8 }, 0)
                .to(scrollIndicatorRef.current, { filter: "blur(10px)", opacity: 0, y: 50, duration: 0.8 }, 0)
                .to(bgContainerRef.current, { opacity: 0, scale: 1.1, duration: 0.8 }, 0.2)
                .fromTo("#about", { filter: "blur(10px)" }, { filter: "blur(0px)", duration: 0.8 }, 0); // Pull About section into focus
        });

        // Mobile fallback
        mm.add("(max-width: 767px)", () => {
            gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top top",
                    end: "bottom top",
                    scrub: 1,
                }
            })
                .to(beyondScrollRef.current, { filter: "blur(10px)", opacity: 0, scale: 0.95, duration: 0.8 }, 0)
                .to(realismScrollRef.current, { filter: "blur(10px)", opacity: 0, scale: 0.95, duration: 0.8 }, 0)
                .to(lowerContentScrollRef.current, { filter: "blur(10px)", opacity: 0, y: 30, duration: 0.8 }, 0)
                .to(scrollIndicatorRef.current, { opacity: 0, y: 20, duration: 0.5 }, 0)
                .to(bgContainerRef.current, { opacity: 0, scale: 1.05, duration: 0.8 }, 0.2);
        });

        return () => mm.revert();
    }, { scope: sectionRef });

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <section
            ref={sectionRef}
            id="hero"
            className="relative z-20 h-screen min-h-[800px] flex flex-col justify-center items-center overflow-hidden"
        >
            {/* Background Container (Fades out to reveal next section underneath) */}
            <div ref={bgContainerRef} className="absolute inset-0 w-full h-full bg-background pointer-events-none z-0">
                <GrainOverlay />
                {/* Vignette Overlay: Darker/more opaque at edges/corners, transparent at center */}
                <div
                    className="absolute inset-0 z-10"
                    style={{
                        background: `radial-gradient(circle at center, transparent 0%, rgba(var(--background), 0.4) 60%, rgba(var(--background), 0.85) 100%)`
                    }}
                />
                {/* Secondary radial gradient for base depth */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800/20 via-background to-background opacity-40 z-0" />
                {/* Animated Gradient Mesh Effect - Desktop Only for performance */}
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-slow-spin bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-[0.03] blur-[100px] z-0 hidden md:block" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
                <div className="space-y-2">
                    <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl tracking-tight text-foreground leading-[0.8] mb-2 flex flex-col items-center">
                        <span className="block overflow-hidden pb-4">
                            {/* Scroll Wrapper */}
                            <span ref={beyondScrollRef} className="block origin-bottom-right">
                                {/* Load Animation Target */}
                                <span ref={beyondLoadRef} className="block">
                                    BEYOND
                                </span>
                            </span>
                        </span>
                        <span className="block overflow-hidden text-foreground/50 pt-2">
                            {/* Scroll Wrapper */}
                            <span ref={realismScrollRef} className="block italic origin-top-left">
                                {/* Load Animation Target */}
                                <span ref={realismLoadRef} className="block">
                                    REALISM
                                </span>
                            </span>
                        </span>
                    </h1>
                </div>

                {/* Everything below the title gets wrapped together for scroll fading */}
                <div ref={lowerContentScrollRef} className="flex flex-col items-center">
                    <p
                        ref={descriptionLoadRef}
                        className="mt-6 max-w-xl text-neutral-600 dark:text-neutral-400 text-lg md:text-xl font-light leading-relaxed text-balance"
                    >
                        Preserve your most cherished memories with a handcrafted portrait that captures the soul of the moment.
                    </p>

                    <div ref={ctaLoadRef} className="mt-10 flex flex-col items-center">
                        <span className="mb-8 text-[10px] md:text-xs uppercase tracking-[0.3em] text-neutral-600 dark:text-neutral-500 font-medium">
                            Available all over India and worldwide
                        </span>

                        <div className="flex flex-col sm:flex-row gap-6 items-center">
                            <MagneticButton
                                onClick={() => scrollToSection("commission-form")}
                                className="px-8 py-4 bg-foreground text-background text-sm font-bold uppercase tracking-widest hover:bg-neutral-200 hover:text-black transition-colors rounded-full"
                            >
                                Commission Now
                            </MagneticButton>

                            <MagneticButton
                                onClick={() => scrollToSection("portfolio")}
                                className="px-8 py-4 bg-background dark:bg-transparent border border-foreground/20 dark:border-foreground/20 text-foreground text-sm font-bold uppercase tracking-widest hover:border-foreground dark:hover:border-foreground transition-colors rounded-full backdrop-blur-sm shadow-sm dark:shadow-none"
                            >
                                View Artworks
                            </MagneticButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div ref={scrollIndicatorRef} className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
                <span className="text-[10px] uppercase tracking-widest text-neutral-600 dark:text-neutral-500">Scroll</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-neutral-600 dark:from-neutral-500 to-transparent" />
            </div>
        </section>
    );
}
