'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    colorClass: string;
}

interface StatusDropdownProps {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function StatusDropdown({ value, options, onChange, disabled }: StatusDropdownProps) {
    const [open, setOpen] = useState(false);
    const openRef = useRef(false);
    const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => { openRef.current = open; }, [open]);

    const current = options.find(o => o.value === value) ?? options[0];

    const toggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;
        if (openRef.current) { setOpen(false); return; }
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setPanelPos({ top: r.bottom + 4, left: r.left });
        }
        setOpen(true);
    };

    // Close when clicking outside (but not on the button or panel)
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (btnRef.current?.contains(target)) return;
            if (panelRef.current?.contains(target)) return;
            setOpen(false);
        };
        const handleScroll = () => setOpen(false);
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [open]);

    const panel = (
        <div
            ref={panelRef}
            style={{
                position: 'fixed',
                top: panelPos.top,
                left: panelPos.left,
                zIndex: 9999,
                minWidth: 140,
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                overflow: 'hidden',
            }}
        >
            {options.map(option => {
                const textClass = option.colorClass.split(' ').find(c => c.startsWith('text-')) ?? 'text-white';
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                            onChange(option.value);
                            setOpen(false);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            width: '100%',
                            padding: '10px 16px',
                            background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: 11,
                            fontWeight: 700,
                            transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                        <span className={textClass}>{option.label}</span>
                        {isActive && <Check size={11} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="relative inline-block" onClick={e => e.stopPropagation()}>
            <button
                ref={btnRef}
                type="button"
                onClick={toggle}
                disabled={disabled}
                className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold
                    transition-all duration-200 cursor-pointer select-none whitespace-nowrap
                    ${current.colorClass}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-125'}
                `}
            >
                <span>{current.label}</span>
                <ChevronDown size={11} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {mounted && open && createPortal(panel, document.body)}
        </div>
    );
}
