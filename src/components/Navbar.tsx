'use client';

import { motion } from 'framer-motion';
import { Instagram, Mail, Youtube } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-[2px]"
        >
            <Link href="/" className="font-serif text-xl tracking-widest text-foreground hover:text-accent transition-colors duration-300">
                ATHARVA SHERLEKAR
            </Link>

            <div className="flex items-center gap-6 text-foreground/80">
                <a href="https://www.instagram.com/atharva_sherlekar_art/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                    <Instagram size={20} />
                </a>
                <a href="https://www.youtube.com/@atharva_sherlekar_art" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                    <Youtube size={20} />
                </a>
                <a href="mailto:atharvasherlekarart@gmail.com" className="hover:text-accent transition-colors">
                    <Mail size={20} />
                </a>
            </div>
        </motion.header>
    );
}
