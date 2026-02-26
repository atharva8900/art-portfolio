'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Settings2, List, DollarSign } from 'lucide-react';

const NAV_ITEMS = [
    { href: '/admin', label: 'Overview', icon: LayoutGrid, exact: true },
    { href: '/admin/availability', label: 'Control', icon: Settings2, exact: false },
    { href: '/admin/commissions', label: 'Commissions', icon: List, exact: false },
    { href: '/admin/payouts', label: 'Payouts', icon: DollarSign, exact: false },
];

export default function AdminNav() {
    const pathname = usePathname();

    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    return (
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
                {/* Back link */}
                <Link
                    href="/"
                    className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-300 transition-colors text-xs font-medium uppercase tracking-widest shrink-0"
                >
                    <span>←</span>
                    <span>Portfolio</span>
                </Link>

                {/* Divider */}
                <div className="h-4 w-px bg-white/10 shrink-0" />

                {/* Tab pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                        const active = isActive(href, exact);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`
                                    flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0
                                    ${active
                                        ? 'bg-accent text-black shadow-md shadow-accent/20'
                                        : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5'
                                    }
                                `}
                            >
                                <Icon size={12} />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
