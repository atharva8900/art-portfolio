'use client';

import MagneticLink from '@/components/shared/MagneticLink';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Mail, Youtube, Menu, X, Home, Palette, DollarSign, Send, Grid, Users } from 'lucide-react';
import Link from 'next/link';
import UserProfile from '@/components/auth/UserProfile';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ARTIST_EMAIL, ARTIST_INSTAGRAM } from '@/lib/config/constants';

const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Portfolio', href: '/#portfolio', icon: Grid },
    { name: 'Categories', href: '/#categories', icon: Palette },
    { name: 'Pricing', href: '/#pricing', icon: DollarSign },
    { name: 'Referrals', href: '/#referrals', icon: Users },
    { name: 'Commission', href: '/#commission-form', icon: Send },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('Home');

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Active section scroll spy
    useEffect(() => {
        const handleScroll = () => {
            const viewportHeight = window.innerHeight;
            // The point we are "looking at" is 30% down the screen
            const checkPoint = viewportHeight * 0.3;

            const sections = navLinks.map(link => {
                if (link.name === 'Home') return 'hero';
                return link.href.replace('/#', '');
            });

            // Iterate sections to find which one contains the checkPoint
            for (const id of sections) {
                const element = document.getElementById(id);
                if (element) {
                    const rect = element.getBoundingClientRect();

                    // console.log(`Section ${id}: top=${rect.top}, bottom=${rect.bottom}, checkPoint=${checkPoint}`); // DEBUG

                    // Check if the checkPoint is strictly inside the element's vertical bounds
                    if (rect.top <= checkPoint && rect.bottom > checkPoint) {
                        const link = navLinks.find(l => {
                            if (l.name === 'Home' && id === 'hero') return true;
                            return l.href === `/#${id}`;
                        });

                        if (link) {
                            // console.log(`Setting active section: ${link.name}`); // DEBUG
                            setActiveSection(link.name);
                        }
                        return; // Found the active section, stop checking others
                    }
                } else {
                    // console.warn(`Element with id ${id} not found`); // DEBUG
                }
            }
        };

        handleScroll(); // Check immediately on mount
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll); // Check on resize too
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        setIsOpen(false);
        if (href.startsWith('/#')) {
            e.preventDefault();
            const id = href.replace('/#', '');
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (href === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <>
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:py-6 md:px-12 bg-gradient-to-b from-background/90 to-transparent backdrop-blur-[2px]"
            >
                <Link href="/" className="font-serif text-sm leading-tight md:text-xl tracking-wider md:tracking-widest text-foreground hover:text-accent transition-colors duration-300 z-50 relative pr-2">
                    ATHARVA SHERLEKAR ART
                </Link>

                {/* Desktop Navigation & Socials */}
                <div className="hidden md:flex items-center gap-2 text-foreground/80">
                    <nav className="flex items-center gap-2 mr-4">
                        {navLinks.filter(l => l.name !== 'Home').map(link => (
                            <MagneticLink
                                key={link.name}
                                href={link.href}
                                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => scrollToSection(e, link.href)}
                                active={activeSection === link.name}
                            >
                                {link.name}
                            </MagneticLink>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4">
                        <a href={ARTIST_INSTAGRAM.startsWith('http') ? ARTIST_INSTAGRAM : `https://www.instagram.com/${ARTIST_INSTAGRAM}/`} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                            <Instagram size={20} />
                        </a>
                        <a href="https://www.youtube.com/@atharva_sherlekar_art" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                            <Youtube size={20} />
                        </a>
                        <a href={`mailto:${ARTIST_EMAIL}`} className="hover:text-accent transition-colors">
                            <Mail size={20} />
                        </a>
                        <ThemeToggle />
                        <UserProfile />
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden items-center gap-2 sm:gap-4 shrink-0 z-50 relative">
                    <ThemeToggle />
                    <UserProfile />
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-foreground hover:text-accent transition-colors p-1"
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </motion.header>

            {/* Mobile Full-Screen Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl overflow-y-auto overscroll-contain"
                    >
                        <div className="min-h-full w-full flex flex-col items-center justify-start pt-28 pb-12 px-6">
                            <nav className="flex flex-col items-center gap-4 w-full max-w-sm">
                                {navLinks.map((link, idx) => (
                                    <motion.a
                                        key={link.name}
                                        href={link.href}
                                        onClick={(e) => scrollToSection(e, link.href)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ delay: 0.1 + idx * 0.1, duration: 0.3 }}
                                        className={`w-full border rounded-xl p-3 flex items-center justify-center gap-3 text-lg font-serif tracking-widest transition-all active:scale-95
                                            ${activeSection === link.name
                                                ? 'bg-accent text-background border-accent font-bold'
                                                : 'bg-surface/50 border-foreground/10 text-foreground hover:bg-surface/80 hover:border-accent/30'
                                            }`}
                                    >
                                        <link.icon size={18} className="text-accent" />
                                        <span>{link.name}</span>
                                    </motion.a>
                                ))}
                            </nav>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mt-8 flex items-center gap-8 text-foreground/60"
                            >
                                <a href={ARTIST_INSTAGRAM.startsWith('http') ? ARTIST_INSTAGRAM : `https://www.instagram.com/${ARTIST_INSTAGRAM}/`} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors p-2">
                                    <Instagram size={24} />
                                </a>
                                <a href="https://www.youtube.com/@atharva_sherlekar_art" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors p-2">
                                    <Youtube size={24} />
                                </a>
                                <a href={`mailto:${ARTIST_EMAIL}`} className="hover:text-accent transition-colors p-2">
                                    <Mail size={24} />
                                </a>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
