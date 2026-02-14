'use client';

import { Instagram, Mail, Youtube } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="py-12 border-t border-white/5 bg-background text-center">
            <div className="flex justify-center gap-8 mb-8 text-neutral-400">
                <a href="https://www.instagram.com/atharva_sherlekar_art/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    <Instagram size={24} />
                </a>
                <a href="https://www.youtube.com/@atharva_sherlekar_art" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    <Youtube size={24} />
                </a>
                <a href="mailto:atharvasherlekarart@gmail.com" className="hover:text-white transition-colors">
                    <Mail size={24} />
                </a>
            </div>
            <p className="font-serif text-lg tracking-widest text-white mb-2">ATHARVA SHERLEKAR</p>
            <p className="text-neutral-600 text-sm uppercase tracking-widest">© {new Date().getFullYear()} All Rights Reserved.</p>
        </footer>
    );
}
