'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Flame, CheckCircle, Info, Lock, X, Frame, Package, Truck, Clock, ArrowRight } from 'lucide-react';
import { getDateCategory, CalendarDateCategory, SIZE_MIN_LEAD_DAYS, SIZE_RUSH_WINDOWS, formatLocalDate, parseLocalDate } from '@/lib/utils/pricing-shared';

interface CommissionCalendarProps {
    value: string; // ISO date string YYYY-MM-DD
    onChange: (dateStr: string) => void;
    queueStartDateStr: string; // ISO date string YYYY-MM-DD
    bookedUntilDateStr: string | null;
    isBooked: boolean;
    size: 'A5' | 'A4' | 'A3' | 'A2';
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CommissionCalendar({
    value,
    onChange,
    queueStartDateStr,
    bookedUntilDateStr,
    isBooked,
    size,
}: CommissionCalendarProps) {
    const queueStartDate = useMemo(() => {
        if (!queueStartDateStr) {
            const d = new Date();
            d.setDate(d.getDate() + 2);
            d.setHours(0, 0, 0, 0);
            return d;
        }
        return parseLocalDate(queueStartDateStr);
    }, [queueStartDateStr]);

    // Initial month is either the selected date or the queue start date
    const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
        if (value) {
            const parsed = parseLocalDate(value);
            return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
        }
        return new Date(queueStartDate.getFullYear(), queueStartDate.getMonth(), 1);
    });
    const [showRushModal, setShowRushModal] = useState(false);

    const currentYear = currentMonthDate.getFullYear();
    const currentMonth = currentMonthDate.getMonth();

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    // Can we go to previous month?
    const canGoPrev = useMemo(() => {
        const prevMonth = new Date(currentYear, currentMonth - 1, 1);
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return prevMonth.getTime() >= thisMonthStart.getTime();
    }, [currentYear, currentMonth, today]);

    const handlePrevMonth = () => {
        if (canGoPrev) {
            setCurrentMonthDate(new Date(currentYear, currentMonth - 1, 1));
        }
    };

    const handleNextMonth = () => {
        setCurrentMonthDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const todayStr = useMemo(() => {
        return formatLocalDate(today);
    }, [today]);

    // Calculate calendar grid days
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const days: Array<{
            dayNum: number;
            dateStr: string;
            dateObj: Date;
            category: CalendarDateCategory;
            isSelectable: boolean;
            isRush: boolean;
            tooltip: string;
            isCurrentMonth: boolean;
            isToday: boolean;
        }> = [];

        // Fill previous month blank spaces
        for (let i = 0; i < firstDayOfMonth; i++) {
            const prevMonthDate = new Date(currentYear, currentMonth, -firstDayOfMonth + i + 1);
            const dateStr = formatLocalDate(prevMonthDate);
            const info = getDateCategory(prevMonthDate, queueStartDate, size, isBooked);
            days.push({
                dayNum: prevMonthDate.getDate(),
                dateStr,
                dateObj: prevMonthDate,
                ...info,
                isCurrentMonth: false,
                isToday: dateStr === todayStr,
            });
        }

        // Fill current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(currentYear, currentMonth, day);
            const dateStr = formatLocalDate(dateObj);
            const info = getDateCategory(dateObj, queueStartDate, size, isBooked);

            days.push({
                dayNum: day,
                dateStr,
                dateObj,
                ...info,
                isCurrentMonth: true,
                isToday: dateStr === todayStr,
            });
        }

        return days;
    }, [currentYear, currentMonth, queueStartDate, size, isBooked, todayStr]);

    // Selected date details
    const selectedDateInfo = useMemo(() => {
        if (!value) return null;
        const dateObj = parseLocalDate(value);
        const info = getDateCategory(dateObj, queueStartDate, size, isBooked);
        return {
            dateObj,
            ...info,
            formatted: dateObj.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })
        };
    }, [value, queueStartDate, size, isBooked]);

    const minLead = SIZE_MIN_LEAD_DAYS[size] || 14;
    const rushWindow = SIZE_RUSH_WINDOWS[size];

    return (
        <div className="w-full bg-surface border border-foreground/10 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
            {/* Queue / Booking Banner */}
            {isBooked && bookedUntilDateStr && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                    <Lock size={15} className="shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold block">Artist Schedule: Booked Until {new Date(bookedUntilDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="text-[11px] opacity-90 block mt-0.5">
                            New commission drawing begins on <strong>{queueStartDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>.
                        </span>
                    </div>
                </div>
            )}

            {/* Visual Color Legend */}
            <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Info size={12} />
                        <span>Calendar Schedule</span>
                    </div>
                    {rushWindow && (
                        <button
                            type="button"
                            onClick={() => setShowRushModal(true)}
                            className="text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            <Flame size={11} className="text-amber-500" />
                            <span>Why rush fee? (7-day buffer)</span>
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                        <span>Booked</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                        <span>Review/Prep (48h)</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-neutral-500/10 border border-foreground/10 text-neutral-500 dark:text-neutral-400 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 dark:bg-neutral-600 shrink-0" />
                        <span>Creation Time ({minLead}d)</span>
                    </div>
                    {rushWindow ? (
                        <button
                            type="button"
                            onClick={() => setShowRushModal(true)}
                            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-500/20 transition-all text-left cursor-pointer group"
                            title="Click to learn why rush fees apply and how the 7-day buffer works"
                        >
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="group-hover:underline">Rush (+30%) ℹ️</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-neutral-500/5 border border-foreground/5 text-neutral-400 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700 shrink-0" />
                            <span>No Rush (A5)</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Standard Available</span>
                    </div>
                </div>
            </div>

            {/* Month Header Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
                <div className="flex items-center gap-2">
                    <CalendarIcon size={18} className="text-accent" />
                    <span className="font-serif font-bold text-base text-foreground">
                        {MONTH_NAMES[currentMonth]} {currentYear}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handlePrevMonth}
                        disabled={!canGoPrev}
                        className={`p-2 rounded-lg border border-foreground/10 transition-colors ${
                            canGoPrev
                                ? 'text-foreground hover:bg-foreground/5 active:bg-foreground/10 cursor-pointer'
                                : 'text-neutral-300 dark:text-neutral-700 opacity-40 cursor-not-allowed'
                        }`}
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-2 rounded-lg border border-foreground/10 text-foreground hover:bg-foreground/5 active:bg-foreground/10 transition-colors cursor-pointer"
                        aria-label="Next month"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                {DAY_NAMES.map((name) => (
                    <div key={name} className="py-1">
                        {name}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {calendarDays.map((cell, idx) => {
                    const isSelected = value === cell.dateStr;

                    if (!cell.isCurrentMonth) {
                        return (
                            <div
                                key={`empty-${idx}`}
                                className="h-10 sm:h-11 flex items-center justify-center text-xs text-neutral-300 dark:text-neutral-700 opacity-20 select-none"
                            >
                                {cell.dayNum}
                            </div>
                        );
                    }

                    // Styling based on category
                    let cellStyle = 'bg-surface text-neutral-400 opacity-40 cursor-not-allowed';
                    let badge = null;

                    if (cell.category === 'past') {
                        cellStyle = 'bg-foreground/5 text-neutral-400 opacity-30 cursor-not-allowed';
                    } else if (cell.category === 'booked') {
                        cellStyle = 'bg-red-500/10 dark:bg-red-500/15 border border-red-500/25 text-red-600 dark:text-red-400 cursor-not-allowed';
                    } else if (cell.category === 'review') {
                        cellStyle = 'bg-blue-500/15 dark:bg-blue-500/20 border border-blue-500/35 text-blue-600 dark:text-blue-400 cursor-not-allowed';
                    } else if (cell.category === 'disabled') {
                        cellStyle = 'bg-neutral-500/5 dark:bg-white/5 border border-transparent text-neutral-400 dark:text-neutral-600 cursor-not-allowed';
                    } else if (cell.category === 'rush') {
                        cellStyle = 'bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:border-amber-500 hover:scale-105 active:scale-95 cursor-pointer font-semibold shadow-xs';
                        badge = <Flame size={10} className="text-amber-500 absolute top-1 right-1" />;
                    } else if (cell.category === 'standard') {
                        cellStyle = 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500 hover:scale-105 active:scale-95 cursor-pointer font-semibold shadow-xs';
                    }

                    // Highlight Current Date with a distinct border (no inner text label)
                    if (cell.isToday && !isSelected) {
                        cellStyle += ' ring-2 ring-accent/70 border-accent/80 font-bold';
                    }

                    if (isSelected) {
                        if (cell.category === 'rush') {
                            cellStyle = 'bg-amber-500/25 dark:bg-amber-500/35 border-2 border-amber-400 dark:border-amber-400 text-amber-950 dark:text-amber-100 ring-2 ring-amber-400/40 font-bold scale-105 shadow-md z-10';
                            badge = <CheckCircle size={10} className="text-amber-400 absolute top-1 right-1" />;
                        } else {
                            cellStyle = 'bg-emerald-500/25 dark:bg-emerald-500/35 border-2 border-emerald-400 dark:border-emerald-400 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-400/40 font-bold scale-105 shadow-md z-10';
                            badge = <CheckCircle size={10} className="text-emerald-400 absolute top-1 right-1" />;
                        }
                    }

                    return (
                        <button
                            key={cell.dateStr}
                            type="button"
                            disabled={!cell.isSelectable}
                            onClick={() => cell.isSelectable && onChange(cell.dateStr)}
                            title={cell.isToday ? `${cell.tooltip} (Today)` : cell.tooltip}
                            className={`relative h-10 sm:h-11 rounded-lg flex flex-col items-center justify-center text-xs transition-all duration-150 touch-manipulation ${cellStyle}`}
                        >
                            <span>{cell.dayNum}</span>
                            {badge}
                        </button>
                    );
                })}
            </div>

            {/* Selected Date Summary & Callout */}
            <AnimatePresence mode="wait">
                {selectedDateInfo ? (
                    <motion.div
                        key={value}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
                            selectedDateInfo.isRush
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-300'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        }`}
                    >
                        {selectedDateInfo.isRush ? (
                            <Flame size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        ) : (
                            <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <div className="flex items-center justify-between font-semibold flex-wrap gap-1">
                                <span>Target Delivery: {selectedDateInfo.formatted}</span>
                                {selectedDateInfo.isRush && (
                                    <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                        +30% Rush Active
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] opacity-90 mt-0.5">
                                {selectedDateInfo.isRush
                                    ? `Rush order selected (${size}). Prioritized whole-day overtime creation, custom framing (if chosen), and secure courier buffer included.`
                                    : `Standard delivery selected (${size}). No rush fee applied.`}
                            </p>
                            {selectedDateInfo.isRush && (
                                <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setShowRushModal(true)}
                                        className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <Info size={12} />
                                        <span>Why is there a rush fee? (How the 7-day buffer works)</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <div className="p-3 rounded-lg bg-foreground/5 border border-foreground/10 text-neutral-500 text-xs flex items-center gap-2">
                        <CalendarIcon size={14} className="text-neutral-400 shrink-0" />
                        <span>Please select an available delivery deadline (green or yellow date) from the calendar above.</span>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick In-Context Rush Explainer Modal */}
            <AnimatePresence>
                {showRushModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
                        onClick={() => setShowRushModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-surface border border-foreground/15 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative text-foreground space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setShowRushModal(false)}
                                className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </button>

                            {/* Modal Header */}
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <Flame size={20} />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-lg leading-tight">
                                        Why I Charge a Rush Fee
                                    </h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        My 7-Day Delivery Buffer Explained
                                    </p>
                                </div>
                            </div>

                            {/* Core Explanation */}
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                                <strong className="block mb-1 font-serif font-bold text-sm">To guarantee delivery by your date, drawing must finish 7 days earlier.</strong>
                                When you pick a date, I give myself an internal deadline by <strong>subtracting 7 days</strong> from your target date. Those 7 days are dedicated to framing, protective packaging, and courier transit.
                            </div>

                            {/* 3 Steps Mini Timeline */}
                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-foreground/5 border border-foreground/10">
                                    <Frame size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block">1–3 Days: Framing</span>
                                        <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">Finalizing your chosen frame style and custom-fitting your portrait (if framed).</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-foreground/5 border border-foreground/10">
                                    <Package size={16} className="text-purple-500 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block">1 Day: Packaging</span>
                                        <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">Packed securely with protective padding to ensure safe doorstep delivery.</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-foreground/5 border border-foreground/10">
                                    <Truck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-semibold block">3–5 Days: Priority Courier Transit</span>
                                        <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">Tracked express courier margin to guarantee arrival on or before your date.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Overtime Note */}
                            <div className="p-3 rounded-lg bg-foreground/5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed flex items-start gap-2">
                                <Clock size={16} className="text-[#e7bb55] shrink-0 mt-0.5" />
                                <span>
                                    Because the 7-day buffer is fixed, a rush deadline squeezes my drawing window. To maintain the exact same 30+ hours of realistic detail, <strong>I work whole-day overtime</strong> from early morning until night.
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-foreground/10 gap-3">
                                <Link
                                    href="/rush-fee"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#e7bb55] hover:underline flex items-center gap-1 font-semibold group"
                                >
                                    Read full behind-the-scenes guide
                                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setShowRushModal(false)}
                                    className="px-4 py-2 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-foreground text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    Got it
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
