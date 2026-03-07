'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, HelpCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'primary' | 'success';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger'
}: ConfirmationModalProps) {
    const variantColors: Record<string, {
        bg: string;
        border: string;
        text: string;
        button: string;
        icon: React.ElementType;
        buttonText?: string;
    }> = {
        primary: {
            bg: 'bg-accent/10',
            border: 'border-accent/20',
            text: 'text-accent',
            button: 'bg-accent hover:bg-accent/80 shadow-accent/20',
            icon: HelpCircle,
            buttonText: 'text-zinc-950'
        },
        danger: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            text: 'text-red-500',
            button: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
            icon: AlertTriangle
        },
        warning: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            text: 'text-amber-500',
            button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
            icon: AlertCircle
        },
        info: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            text: 'text-blue-500',
            button: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20',
            icon: Info
        },
        success: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            text: 'text-emerald-500',
            button: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20',
            icon: CheckCircle2
        }
    };

    const colors = variantColors[variant] || variantColors.danger;
    const Icon = colors.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-surface border border-foreground/10 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-2xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}>
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium text-foreground">{title}</h3>
                                    <p className="text-sm text-neutral-400 mt-1">{message}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold rounded-2xl transition-all border border-foreground/10"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`flex-1 py-3 px-4 ${colors.button} ${colors.buttonText || 'text-white'} font-bold rounded-2xl transition-all shadow-lg active:scale-95`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>

                        {/* Decoration */}
                        <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} blur-[60px] -mr-16 -mt-16 rounded-full opacity-50`} />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
