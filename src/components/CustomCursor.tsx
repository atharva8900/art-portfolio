"use client";
import { useEffect, useRef, useState } from "react";

const getBackgroundColor = (element: HTMLElement | null): string => {
    const bodyBg = typeof window !== 'undefined' ? window.getComputedStyle(document.body).backgroundColor : '#0a0a0a';
    if (!element) return bodyBg;

    let current: HTMLElement | null = element;
    while (current) {
        if (!(current instanceof Element)) break;

        const style = window.getComputedStyle(current);
        const bgColor = style.backgroundColor;

        // Check for non-transparent. Lowered threshold to 0.1 to catch semi-transparent nav buttons.
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            if (bgColor.startsWith('rgba')) {
                const alpha = parseFloat(bgColor.split(',')[3]);
                if (alpha < 0.1) {
                    current = current.parentElement;
                    continue;
                }
            }
            return bgColor;
        }
        current = current.parentElement;
    }
    return bodyBg;
};

export default function CustomCursor() {
    const svgPathRef = useRef<SVGPathElement>(null);
    const pencilRef = useRef<HTMLDivElement>(null);
    const eraserRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const prevMouse = useRef({ x: 0, y: 0 });
    const mouse = useRef({ x: 0, y: 0 });
    const points = useRef<{ x: number; y: number }[]>([]);
    const trailLength = 35;
    const rafId = useRef<number>(0);

    // Initial fallback that will be updated on mount
    const eraserColor = useRef("#0a0a0a");

    useEffect(() => {
        if (typeof window !== "undefined") {
            eraserColor.current = window.getComputedStyle(document.body).backgroundColor;
        }
    }, []);

    const isPointerRef = useRef(false);
    const [isPointer, setIsPointer] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 768) return;

        // Initialize points in center
        const startX = window.innerWidth / 2;
        const startY = window.innerHeight / 2;

        mouse.current = { x: startX, y: startY };

        points.current = [];
        for (let i = 0; i < trailLength; i++) {
            points.current.push({ x: startX, y: startY });
        }

        const handleMouseMove = (e: MouseEvent) => {
            try {
                mouse.current.x = e.clientX;
                mouse.current.y = e.clientY;

                const target = e.target as HTMLElement;

                // Safety check: ensure target is an element before accessing style
                if (!target || !(target instanceof Element)) {
                    setIsPointer(false);
                    isPointerRef.current = false;
                    return;
                }

                const computedStyle = window.getComputedStyle(target);

                const isClickable =
                    computedStyle.cursor === "pointer" ||
                    target.tagName === "BUTTON" ||
                    target.tagName === "A" ||
                    !!target.closest("button") ||
                    !!target.closest("a");

                setIsPointer(isClickable);
                isPointerRef.current = isClickable;

                if (isClickable) {
                    const interactiveEl = target.closest("button") || target.closest("a") || target;
                    // Directly use getBackgroundColor with try-catch
                    eraserColor.current = getBackgroundColor(interactiveEl as HTMLElement);
                }
            } catch (error) {
                console.error("CustomCursor error:", error);
            }
        };

        const animate = () => {
            // Smooth follow - increased from 0.35 to 0.5 to make it catch up faster
            const followStrength = 0.5;

            points.current[0].x +=
                (mouse.current.x - points.current[0].x) * followStrength;
            points.current[0].y +=
                (mouse.current.y - points.current[0].y) * followStrength;

            for (let i = 1; i < trailLength; i++) {
                points.current[i].x +=
                    (points.current[i - 1].x - points.current[i].x) * followStrength;
                points.current[i].y +=
                    (points.current[i - 1].y - points.current[i].y) * followStrength;
            }

            // For Eraser Mode: We still use a stroked path for simplicity
            let d = `M ${points.current[0].x} ${points.current[0].y}`;

            if (isPointerRef.current) {
                // Std quadratic stroked path for eraser
                for (let i = 1; i < trailLength - 1; i++) {
                    const xc = (points.current[i].x + points.current[i + 1].x) / 2;
                    const yc = (points.current[i].y + points.current[i + 1].y) / 2;
                    d += ` Q ${points.current[i].x} ${points.current[i].y} ${xc} ${yc}`;
                }

                if (svgPathRef.current) {
                    svgPathRef.current.setAttribute("d", d);
                    svgPathRef.current.setAttribute("stroke", eraserColor.current);
                    svgPathRef.current.setAttribute("stroke-width", "20");
                    svgPathRef.current.setAttribute("fill", "none");
                }
            } else {
                // Tapered shape for Pencil Mode
                // We calculate normals for each point to create a polygon
                const maxThickness = 1.5;
                let topPath = `M ${points.current[0].x} ${points.current[0].y}`;
                let bottomPath = "";

                // Calculate the vertices for the envelope
                for (let i = 1; i < trailLength - 1; i++) {
                    const pPrev = points.current[i - 1];
                    const pNext = points.current[i + 1];

                    // Direction of the curve at this point
                    let dx = pNext.x - pPrev.x;
                    let dy = pNext.y - pPrev.y;
                    let len = Math.sqrt(dx * dx + dy * dy);

                    if (len === 0) {
                        dx = 1; dy = 0; len = 1;
                    }

                    // Normal vector
                    const nx = -dy / len;
                    const ny = dx / len;

                    // Tapering function: Starts at 0, goes to maxThickness, drops back to 0
                    // Uses a sine curve over the length of the trail for a smooth taper
                    const progress = i / (trailLength - 1);
                    const thickness = maxThickness * Math.sin(progress * Math.PI);

                    const topX = points.current[i].x + nx * thickness;
                    const topY = points.current[i].y + ny * thickness;

                    const bottomX = points.current[i].x - nx * thickness;
                    const bottomY = points.current[i].y - ny * thickness;

                    topPath += ` L ${topX} ${topY}`;
                    bottomPath = ` L ${bottomX} ${bottomY}` + bottomPath;
                }

                // Close the shape
                const lastPoint = points.current[trailLength - 1];
                topPath += ` L ${lastPoint.x} ${lastPoint.y}`;
                const finalPath = topPath + bottomPath + " Z";

                if (svgPathRef.current) {
                    svgPathRef.current.setAttribute("d", finalPath);
                    svgPathRef.current.setAttribute("fill", "rgb(var(--foreground))");
                    svgPathRef.current.setAttribute("stroke", "none");
                }
            }

            if (containerRef.current) {
                containerRef.current.style.left = `${mouse.current.x}px`;
                containerRef.current.style.top = `${mouse.current.y}px`;
            }

            if (pencilRef.current) {
                const dx = mouse.current.x - prevMouse.current.x;
                const dy = mouse.current.y - prevMouse.current.y;
                const speed = Math.sqrt(dx * dx + dy * dy);

                let angle = 45;

                if (speed > 0.5) {
                    angle = Math.atan2(dy, dx) * (180 / Math.PI);
                }

                prevMouse.current = { ...mouse.current };

                const currentRotation = parseFloat(
                    pencilRef.current.dataset.rotation || "0"
                );

                let deltaAngle = angle - currentRotation;
                while (deltaAngle > 180) deltaAngle -= 360;
                while (deltaAngle < -180) deltaAngle += 360;

                const smoothedRotation = currentRotation + deltaAngle * 0.05;

                pencilRef.current.dataset.rotation =
                    smoothedRotation.toString();

                pencilRef.current.style.transformOrigin = "2px 22px";
                pencilRef.current.style.transform = `rotate(${smoothedRotation - 45}deg)`;

                if (eraserRef.current) {
                    eraserRef.current.style.transformOrigin = "center";
                    eraserRef.current.style.transform = `rotate(0deg)`; // Fixed angle
                }
            }

            rafId.current = requestAnimationFrame(animate);
        };

        animate();

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(rafId.current);
        };
    }, []);

    return (
        <>
            <svg
                className="custom-cursor-element hidden md:block fixed top-0 left-0 pointer-events-none z-[9998] transition-opacity duration-200"
                width="100%"
                height="100%"
            >
                <path
                    ref={svgPathRef}
                    fill="rgb(var(--foreground))"
                    stroke="none"
                />
            </svg>

            <div
                ref={containerRef}
                className="custom-cursor-element hidden md:block fixed pointer-events-none z-[9999] mix-blend-difference"
                style={{ left: 0, top: 0 }}
            >
                {/* Pencil */}
                <div
                    ref={pencilRef}
                    className={`text-white transition-opacity duration-200 absolute ${isPointer ? "opacity-0 scale-90" : "opacity-100 scale-100"
                        }`}
                    style={{
                        width: "24px",
                        height: "24px",
                        left: "-2px",
                        top: "-22px",
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                    </svg>
                </div>

                {/* Eraser */}
                <div
                    ref={eraserRef}
                    className={`absolute transition-all duration-200 ${isPointer ? "opacity-100 scale-100" : "opacity-0 scale-0"
                        }`}
                    style={{
                        width: "32px",
                        height: "32px",
                        left: "-2px",
                        top: "-22px",
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="white"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        {/* Eraser Body */}
                        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                        {/* Detail Lines (Black strokes on white fill = transparent/original color) */}
                        <path d="M22 21H7" strokeWidth="2" />
                        <path d="m5 11 9 9" strokeWidth="2" />
                    </svg>
                </div>
            </div>
        </>
    );
}
