'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
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
    const variantColors = {
        danger: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            text: 'text-red-500',
            button: 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
        },
        warning: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            text: 'text-amber-500',
            button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
        },
        info: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            text: 'text-blue-500',
            button: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
        }
    };

    const colors = variantColors[variant];

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
                        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-2xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}>
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium text-foreground">{title}</h3>
                                    <p className="text-sm text-neutral-400 mt-1">{message}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-foreground font-bold rounded-2xl transition-all border border-zinc-700"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`flex-1 py-3 px-4 ${colors.button} text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95`}
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
