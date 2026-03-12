'use client';

import { useState, useRef, useCallback } from 'react';

interface ClockTimePickerProps {
    value: string; // HH:MM in 24h format
    onConfirm: (value: string) => void;
    onClose: () => void;
}

export default function ClockTimePicker({ value, onConfirm, onClose }: ClockTimePickerProps) {
    const parseTime = (val: string) => {
        const [h, m] = (val || '23:59').split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return { hour: hour12, minute: m || 0, period: period as 'AM' | 'PM' };
    };

    const initial = parseTime(value);
    const [mode, setMode] = useState<'hour' | 'minute'>('hour');
    const [hour, setHour] = useState(initial.hour);
    const [minute, setMinute] = useState(initial.minute);
    const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period);
    const clockRef = useRef<HTMLDivElement>(null);

    const get24Hour = () => {
        if (period === 'AM') return hour === 12 ? 0 : hour;
        return hour === 12 ? 12 : hour + 12;
    };

    const formatted = `${String(get24Hour()).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    // The angle for the clock hand (12 o'clock is -90deg)
    const hourDeg = ((hour % 12) / 12) * 360 - 90;
    const minuteDeg = (minute / 60) * 360 - 90;
    const handAngle = mode === 'hour' ? hourDeg : minuteDeg;

    const RADIUS = 90; // px from center to numbers
    const SIZE = 240;  // clock face diameter

    const getValueFromAngle = useCallback((clientX: number, clientY: number) => {
        if (!clockRef.current) return;
        const rect = clockRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const x = clientX - cx;
        const y = clientY - cy;
        let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        if (mode === 'hour') {
            const h = Math.round(angle / 30) || 12;
            setHour(h);
            setTimeout(() => setMode('minute'), 280);
        } else {
            const m = Math.round(angle / 6) % 60;
            setMinute(m);
        }
    }, [mode]);

    const handleClockClick = useCallback((e: React.MouseEvent) => {
        getValueFromAngle(e.clientX, e.clientY);
    }, [getValueFromAngle]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const t = e.changedTouches[0];
        getValueFromAngle(t.clientX, t.clientY);
    }, [getValueFromAngle]);

    const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minuteMarkers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const markers = mode === 'hour' ? hourNumbers : minuteMarkers;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="bg-[#1a1a1c] rounded-3xl p-6 w-80 shadow-2xl border border-white/8"
                onClick={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
            >
                {/* Label */}
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-4">
                    Select time · <span className="text-amber-400/80">IST (UTC+5:30)</span>
                </p>

                {/* Digital header */}
                <div className="flex items-center gap-2 mb-6">
                    <button
                        onClick={() => setMode('hour')}
                        className={`text-5xl font-bold rounded-2xl px-4 py-2 transition-all duration-200 ${mode === 'hour' ? 'bg-blue-500 text-white' : 'bg-white/5 text-neutral-500'}`}
                    >
                        {String(hour).padStart(2, '0')}
                    </button>
                    <span className="text-4xl font-bold text-neutral-600 pb-0.5">:</span>
                    <button
                        onClick={() => setMode('minute')}
                        className={`text-5xl font-bold rounded-2xl px-4 py-2 transition-all duration-200 ${mode === 'minute' ? 'bg-blue-500 text-white' : 'bg-white/5 text-neutral-500'}`}
                    >
                        {String(minute).padStart(2, '0')}
                    </button>
                    <div className="flex flex-col gap-1.5 ml-auto">
                        {(['AM', 'PM'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`text-xs font-bold rounded-xl px-3 py-2 border transition-all duration-200 ${period === p ? 'bg-blue-500 text-white border-transparent' : 'bg-white/5 text-neutral-500 border-white/8'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Clock face */}
                <div
                    ref={clockRef}
                    className="relative mx-auto rounded-full cursor-pointer select-none"
                    style={{
                        width: SIZE,
                        height: SIZE,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                    }}
                    onClick={handleClockClick}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Outer ring decoration */}
                    <div
                        className="absolute inset-0 rounded-full border border-white/5"
                        style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)' }}
                    />

                    {/* Center dot */}
                    <div className="absolute top-1/2 left-1/2 z-10 w-2.5 h-2.5 rounded-full bg-blue-500 -translate-x-1/2 -translate-y-1/2" />

                    {/* Hand */}
                    <div
                        className="absolute top-1/2 left-1/2 origin-left z-0 transition-transform duration-200"
                        style={{
                            width: `${RADIUS - 18}px`,
                            height: 2,
                            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                            borderRadius: 4,
                            transform: `translateY(-50%) rotate(${handAngle}deg)`,
                            boxShadow: '0 0 6px rgba(96,165,250,0.4)',
                        }}
                    />

                    {/* Numbers */}
                    {markers.map((num, i) => {
                        const angleDeg = (i / 12) * 360 - 90;
                        const rad = (angleDeg * Math.PI) / 180;
                        const x = SIZE / 2 + RADIUS * Math.cos(rad);
                        const y = SIZE / 2 + RADIUS * Math.sin(rad);
                        const isSelected = mode === 'hour' ? num === hour : num === minute;

                        return (
                            <div
                                key={num}
                                className={`absolute flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-all duration-150 -translate-x-1/2 -translate-y-1/2 ${isSelected
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110'
                                    : 'text-neutral-300 hover:bg-white/10'
                                    }`}
                                style={{ left: x, top: y }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (mode === 'hour') {
                                        setHour(num);
                                        setTimeout(() => setMode('minute'), 200);
                                    } else {
                                        setMinute(num);
                                    }
                                }}
                            >
                                {mode === 'hour' ? num : String(num).padStart(2, '0')}
                            </div>
                        );
                    })}
                </div>

                {/* Mode hint */}
                <p className="text-center text-[10px] text-neutral-600 mt-3 uppercase tracking-widest">
                    {mode === 'hour' ? 'Select hour' : 'Select minute'}
                </p>

                {/* Footer buttons */}
                <div className="flex justify-end gap-4 mt-4">
                    <button
                        onClick={onClose}
                        className="text-sm text-neutral-500 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(formatted)}
                        className="text-sm text-blue-400 font-bold hover:text-blue-300 transition-colors px-4 py-2 rounded-xl hover:bg-blue-500/10"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
