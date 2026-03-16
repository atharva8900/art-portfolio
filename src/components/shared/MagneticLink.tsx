"use client";

import { motion } from "framer-motion";
import { ReactNode, useRef, useState } from "react";

interface MagneticLinkProps {
    children: ReactNode;
    href: string;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    active?: boolean;
}

export default function MagneticLink({
    children,
    href,
    className = "",
    onClick,
    active = false,
}: MagneticLinkProps) {
    const ref = useRef<HTMLAnchorElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
        <motion.a
            ref={ref}
            href={href}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            animate={{ x, y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            className={`
                relative flex items-center justify-center px-5 py-2 rounded-full transition-colors duration-300
                ${active ? 'bg-foreground text-background font-medium' : 'text-foreground/80 hover:text-foreground hover:bg-surface/80'}
                ${className}
            `}
        >
            <span className="relative z-10 pointer-events-none text-sm tracking-widest uppercase">
                {children}
            </span>
        </motion.a>
    );
}
