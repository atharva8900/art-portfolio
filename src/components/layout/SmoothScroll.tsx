"use client";

import { ReactNode, useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Register GSAP plugins globally once
if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        // Disable Lenis on mobile/touch devices for better performance/INP
        if (window.innerWidth < 768) return;

        const lenis = new Lenis({
            // Optional: tune Lenis settings here for weight/feel
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            touchMultiplier: 0, // Disable specifically for touch if somehow still active
        });
        lenisRef.current = lenis;

        // Synchronize GSAP ScrollTrigger with Lenis scroll events
        lenis.on("scroll", ScrollTrigger.update);

        // Tell GSAP to use Lenis's requestAnimationFrame for its internal ticker
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        // Disable GSAP's lag smoothing to prevent conflicts with Lenis's own smoothing
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(lenis.raf);
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
}
