'use client';
import Link from 'next/link';
import { Instagram, Mail, Youtube } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="py-12 border-t border-foreground/5 bg-background text-center">
            <div className="flex justify-center gap-8 mb-8 text-neutral-600 dark:text-neutral-400">
                <a href={process.env.NEXT_PUBLIC_ARTIST_INSTAGRAM?.startsWith('http') ? process.env.NEXT_PUBLIC_ARTIST_INSTAGRAM : `https://www.instagram.com/${process.env.NEXT_PUBLIC_ARTIST_INSTAGRAM || 'atharva_sherlekar_art'}/`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    <Instagram size={24} />
                </a>
                <a href="https://www.youtube.com/@atharva_sherlekar_art" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    <Youtube size={24} />
                </a>
                <a href={`mailto:${process.env.NEXT_PUBLIC_ARTIST_EMAIL || 'atharvasherlekarart@gmail.com'}`} className="hover:text-foreground transition-colors">
                    <Mail size={24} />
                </a>
            </div>

            <div className="flex justify-center flex-wrap gap-4 md:gap-6 mb-8 text-neutral-600 dark:text-neutral-500 text-xs md:text-sm">
                <Link href="/commission-process" className="hover:text-foreground transition-colors">Commission Process</Link>
                <Link href="/legal/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link href="/legal/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link>
                <Link href="/legal/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link>
            </div>

            <p className="font-serif text-lg tracking-widest text-foreground mb-2">ATHARVA SHERLEKAR ART</p>
            <p className="text-neutral-700 dark:text-neutral-600 text-sm uppercase tracking-widest">© {new Date().getFullYear()} All Rights Reserved.</p>
        </footer >
    );
}
