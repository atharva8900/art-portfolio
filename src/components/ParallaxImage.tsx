import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

interface ParallaxImageProps {
    src: string;
    alt: string;
    className?: string;
}

const MotionImage = motion(Image);

export default function ParallaxImage({ src, alt, className = "" }: ParallaxImageProps) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
    const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1]);

    return (
        <div ref={ref} className={`overflow-hidden relative ${className}`}>
            <MotionImage
                src={src}
                alt={alt}
                style={{ y, scale }}
                fill
                className="object-cover"
            />
        </div>
    );
}
