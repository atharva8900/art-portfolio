"use client";

import { motion } from "framer-motion";
import { ReactNode, useRef, useState } from "react";

export default function MagneticButton({
    children,
    className = "",
    onClick,
}: {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}) {
    const ref = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current!.getBoundingClientRect();
        const x = clientX - (left + width / 2);
        const y = clientY - (top + height / 2);
        setPosition({ x, y });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    const { x, y } = position;

    return (
        <motion.button
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            animate={{ x, y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            className={`relative ${className}`}
        >
            <span className="relative z-10 pointer-events-none block" data-text-content>
                {typeof children === 'string'
                    ? children.split('').map((char, index) => (
                        <span
                            key={index}
                            data-eraser-target
                            className="inline-block pointer-events-auto transition-opacity duration-300"
                        >
                            {char === ' ' ? '\u00A0' : char}
                        </span>
                    ))
                    : children}
            </span>
        </motion.button>
    );
}
