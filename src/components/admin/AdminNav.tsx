'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Settings2, List, DollarSign, Users, Zap } from 'lucide-react';

const NAV_ITEMS = [
    { href: '/admin', label: 'Overview', icon: LayoutGrid, exact: true },
    { href: '/admin/availability', label: 'Control', icon: Settings2, exact: false },
    { href: '/admin/commissions', label: 'Commissions', icon: List, exact: false },
    { href: '/admin/payouts', label: 'Payouts', icon: DollarSign, exact: false },
    { href: '/admin/referrers', label: 'Affiliates', icon: Users, exact: false },
    { href: '/admin/offers', label: 'Offers', icon: Zap, exact: false },
];

export default function AdminNav() {
    const pathname = usePathname();

    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    return (
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-foreground/5 py-2">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center gap-4 md:gap-6">
                {/* Back link */}
                <Link
                    href="/"
                    className="flex items-center gap-2 text-neutral-500 hover:text-foreground transition-all duration-300 text-xs md:text-sm font-bold uppercase tracking-widest shrink-0 hover:scale-105"
                >
                    <span>←</span>
                    <span className="hidden sm:inline">Portfolio</span>
                </Link>

                {/* Divider */}
                <div className="h-6 md:h-8 w-px bg-foreground/10 shrink-0" />

                {/* Tab pills */}
                <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1">
                    {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                        const active = isActive(href, exact);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`
                                    flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 shrink-0
                                    ${active
                                        ? 'bg-accent text-black shadow-lg shadow-accent/30 scale-[1.02]'
                                        : 'text-neutral-500 hover:text-foreground hover:bg-foreground/5'
                                    }
                                `}
                            >
                                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
