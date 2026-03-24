'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot, User, Instagram } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { usePathname } from 'next/navigation';
import fpPromise from '@fingerprintjs/fingerprintjs';

export default function ChatWidget() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [inputValue, setInputValue] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [messageCount, setMessageCount] = useState(0);
    const [fingerprint, setFingerprint] = useState<string>('unknown_device');

    // Initialize/Check Daily Limit & Fingerprint
    useEffect(() => {
        // Init Fingerprint
        const initFingerprint = async () => {
            try {
                const fp = await fpPromise.load();
                const result = await fp.get();
                setFingerprint(result.visitorId);
            } catch (err) {
                console.error("Failed to generate fingerprint:", err);
            }
        };
        initFingerprint();

        // Local Storage Fallback
        const savedData = localStorage.getItem('art_assistant_limit');
        if (savedData) {
            try {
                const { count, timestamp } = JSON.parse(savedData);
                const now = Date.now();
                if (now - timestamp > 24 * 60 * 60 * 1000) {
                    localStorage.setItem('art_assistant_limit', JSON.stringify({ count: 0, timestamp: now }));
                    setMessageCount(0);
                } else {
                    setMessageCount(count);
                }
            } catch {
                localStorage.setItem('art_assistant_limit', JSON.stringify({ count: 0, timestamp: Date.now() }));
            }
        } else {
            localStorage.setItem('art_assistant_limit', JSON.stringify({ count: 0, timestamp: Date.now() }));
        }
    }, []);

    // Event listener for external triggers (like the FAQ's "Start a Chat")
    useEffect(() => {
        const handleOpenChat = () => setIsOpen(true);
        window.addEventListener('open-chat', handleOpenChat);
        return () => window.removeEventListener('open-chat', handleOpenChat);
    }, []);

    // Cooldown Timer Logic
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const { messages, append, status, error } = useChat({
        api: `/api/chat?fingerprint=${fingerprint}`,
        onFinish: () => {
            const newCount = messageCount + 1;
            setMessageCount(newCount);
            const savedData = JSON.parse(localStorage.getItem('art_assistant_limit') || '{}');
            localStorage.setItem('art_assistant_limit', JSON.stringify({
                count: newCount,
                timestamp: savedData.timestamp || Date.now()
            }));
            setCooldown(15);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any) as any;

    const isChatLoading = status === 'submitted' || status === 'streaming';
    const isLimitReached = messageCount >= 25;

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isChatLoading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (cooldown > 0 || isLimitReached || !inputValue.trim() || isChatLoading) return;

        const text = inputValue;
        setInputValue('');
        await append({ role: 'user', content: text });
    };

    const getMessageText = (m: UIMessage) => {
        return m.parts
            ?.filter(p => p.type === 'text')
            .map(p => (p as { type: 'text'; text: string }).text)
            .join('') || '';
    };

    if (pathname?.startsWith('/admin') || pathname?.startsWith('/client')) {
        return null;
    }

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[60] p-4 bg-foreground text-background rounded-full shadow-2xl flex items-center justify-center border border-white/10"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </motion.button>

            {/* Chat Window Container */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-24 right-6 z-[60] w-[calc(100vw-3rem)] sm:w-[400px] h-[600px] max-h-[70vh] flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-background/80 backdrop-blur-md md:backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                                    <Bot size={20} className="text-accent" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg tracking-wide text-foreground">Art Assistant</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-400 hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            data-lenis-prevent
                            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar relative"
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            {/* Static welcome message */}
                            <div className="flex justify-start items-start gap-3">
                                <div className="mt-1 shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                                    <Bot size={14} className="text-accent" />
                                </div>
                                <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed bg-white/5 border border-white/5 text-foreground/90 prose prose-invert prose-p:leading-relaxed prose-pre:p-0 min-w-0">
                                    <ReactMarkdown>
                                        {"Hi! I'm Atharva's AI assistant. 🎨 I can help you with pricing, sizing, and any questions about commissioning a portrait. \n\n*Note: I can answer up to 25 messages per visitor each day.* \n\nHow can I help you today?"}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* Dynamic messages from hook */}
                            {messages.map((m: UIMessage) => (
                                <div
                                    key={m.id}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
                                >
                                    {m.role !== 'user' && (
                                        <div className="mt-1 shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                                            <Bot size={14} className="text-accent" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed min-w-0 ${m.role === 'user'
                                            ? 'bg-foreground text-background font-medium'
                                            : 'bg-white/5 border border-white/5 text-foreground/90 prose prose-invert prose-p:leading-relaxed prose-pre:p-0'
                                            }`}
                                    >
                                        {m.role === 'user' ? (
                                            getMessageText(m)
                                        ) : (
                                            <ReactMarkdown>
                                                {getMessageText(m)}
                                            </ReactMarkdown>
                                        )}
                                    </div>

                                    {m.role === 'user' && (
                                        <div className="mt-1 shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                            <User size={14} className="text-neutral-400" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isChatLoading && (
                                <div className="flex justify-start items-center gap-3">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                                        <Loader2 size={14} className="text-accent animate-spin" />
                                    </div>
                                    <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center space-y-3">
                                    <div className="space-y-1">
                                        <p className="font-bold">I&apos;m having trouble connecting right now.</p>
                                        <p className="opacity-80">This usually happens if I&apos;ve answered too many questions recently. Please try again in 30-60 seconds or clear the chat.</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors font-medium border border-red-500/30"
                                        >
                                            Clear Chat & Refresh
                                        </button>
                                        <a
                                            href={`https://www.instagram.com/${process.env.NEXT_PUBLIC_ARTIST_INSTAGRAM || 'atharva_sherlekar_art'}/`}
                                            target="_blank"
                                            className="flex items-center justify-center gap-2 text-accent hover:underline font-bold uppercase tracking-tighter pt-1"
                                        >
                                            <Instagram size={14} />
                                            Message on Instagram
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form
                            onSubmit={handleFormSubmit}
                            className="p-6 border-t border-white/5 bg-white/5"
                        >
                            <div className="relative flex items-center">
                                <input
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    disabled={isChatLoading || isLimitReached || cooldown > 0}
                                    placeholder={
                                        isLimitReached
                                            ? "Daily limit reached. Refresh tomorrow!"
                                            : cooldown > 0
                                                ? `Wait ${cooldown}s...`
                                                : "Ask about portraits, pricing..."
                                    }
                                    className={`w-full bg-background/50 border border-white/10 rounded-full px-6 py-3 pr-14 text-sm focus:outline-none transition-all placeholder:text-neutral-600 ${(isLimitReached || cooldown > 0)
                                        ? 'opacity-50 cursor-not-allowed bg-white/5'
                                        : 'focus:border-accent/50 focus:ring-1 focus:ring-accent/20'
                                        }`}
                                />
                                <button
                                    type="submit"
                                    disabled={isChatLoading || !inputValue.trim() || isLimitReached || cooldown > 0}
                                    className="absolute right-2 p-2 bg-foreground text-background rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <p className="mt-3 text-[10px] text-center text-neutral-500 uppercase tracking-widest font-medium">
                                AI can make mistakes. Verify pricing with Atharva.
                            </p>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
