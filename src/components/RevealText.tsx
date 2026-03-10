"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface RevealTextProps {
    children: string;
    className?: string;
    delay?: number;
}

export default function RevealText({ children, className = "", delay = 0 }: RevealTextProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10%" });

    const words = children.split(" ");

    return (
        <span ref={ref} className={`inline-block ${className}`}>
            {words.map((word, i) => (
                <span key={i} style={{ marginRight: '0.25em' }} className="inline-block overflow-hidden -mb-[0.1em] align-bottom">
                    <motion.span
                        initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { y: 0 } : { y: "100%" }}
                        animate={isInView ? { y: 0 } : {}}
                        transition={{
                            duration: 0.8,
                            ease: [0.16, 1, 0.3, 1],
                            delay: delay + i * 0.03,
                        }}
                        className="inline-block"
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </span>
    );
}
