'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Plus, Minus, Lock, Instagram, Clock, Palette, Truck, Hourglass, Info, ChevronDown, Check, Flame, Sparkles, Frame, X } from 'lucide-react';
import { calculatePortraitPrice, FRAMING_PRICES } from '@/lib/pricing-shared';
import { useSession } from 'next-auth/react';
import { createClient } from '@/lib/supabase/client';
import GoogleSignInButton from './GoogleSignInButton';
import { createPortal } from 'react-dom';
import ArtVisualizer, { FrameConfig } from './ArtVisualizer';
import Script from 'next/script';

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Razorpay: any;
    }
}



// Custom paper size dropdown — portal-based so it escapes any overflow container
function PaperSizeDropdown({ value, onChange, options }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    const [open, setOpen] = useState(false);
    const openRef = useRef(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const [mounted, setMounted] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    useEffect(() => { setMounted(true); }, []);

    // Keep ref in sync
    useEffect(() => { openRef.current = open; }, [open]);

    const current = options.find(o => o.value === value) ?? options[0];

    const toggle = () => {
        if (openRef.current) {
            setOpen(false);
            return;
        }
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + 2, left: r.left, width: r.width });
        }
        setOpen(true);
    };

    // Close when clicking outside (but not on the button itself — that's handled by toggle)
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (btnRef.current?.contains(target)) return; // button handles its own toggle
            if (panelRef.current?.contains(target)) return; // panel handles its own clicks
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

    const panel = mounted && open ? createPortal(
        <div
            ref={panelRef}
            style={{
                position: 'fixed', top: pos.top, left: pos.left, width: pos.width,
                zIndex: 9999,
                borderRadius: 8, overflow: 'hidden',
            }}
            className="bg-surface dark:bg-neutral-900 border border-foreground/10 dark:border-white/10 shadow-xl dark:shadow-2xl"
        >
            {options.map(opt => {
                const isActive = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => { onChange(opt.value); setOpen(false); }}
                        className={`flex items-center justify-between w-full px-4 py-3.5 text-left text-sm transition-colors border-none cursor-pointer ${isActive
                            ? 'bg-foreground/5 dark:bg-white/10 text-foreground dark:text-neutral-200'
                            : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-foreground/5 dark:hover:bg-white/5'
                            }`}
                    >
                        <span>{opt.label}</span>
                        {isActive && <Check size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />}
                    </button>
                );
            })}
        </div>,
        document.body
    ) : null;

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={toggle}
                className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground outline-none transition-colors flex items-center justify-between hover:border-foreground/30"
            >
                <span>{current?.label}</span>
                <ChevronDown size={16} className={`text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {panel}
        </>
    );
}


export default function CommissionForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [availability, setAvailability] = useState(true);
    const [status, setStatus] = useState<'open' | 'waitlist' | 'closed'>('open');
    const [immediateSlotsRemaining, setImmediateSlotsRemaining] = useState<number | null>(null);
    const [waitlistSlotsRemaining, setWaitlistSlotsRemaining] = useState<number | null>(null);
    const { data: session, status: authStatus } = useSession();
    const [hasActive, setHasActive] = useState(false);
    const [activeStatus, setActiveStatus] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<{ name: string; content: string }[]>([]);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [referrerName, setReferrerName] = useState<string | null>(null);
    const [referrerEmail, setReferrerEmail] = useState<string | null>(null);
    const [referrerPhone, setReferrerPhone] = useState<string | null>(null);
    const [showBackgroundInfo, setShowBackgroundInfo] = useState(false);
    const [showTimelapseInfo, setShowTimelapseInfo] = useState(false);
    const [showFramingInfo, setShowFramingInfo] = useState(false);
    const [currentPrices, setCurrentPrices] = useState({ A5: '₹500', A4: '₹1000', A3: '₹2000' });
    const [selectedSize, setSelectedSize] = useState<string>('A5');
    const [peopleCount, setPeopleCount] = useState<number>(1);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [detailedBackground, setDetailedBackground] = useState(false);
    const [timelapse, setTimelapse] = useState(false);
    const [framing, setFraming] = useState(false);
    const [consent, setConsent] = useState(false);
    const [frameConfig, setFrameConfig] = useState<FrameConfig | null>(null);
    const [showFrameModal, setShowFrameModal] = useState(false);
    const [isSelfReferral, setIsSelfReferral] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    const [estimatedTotal, setEstimatedTotal] = useState<number>(0);
    const supabase = createClient();

    const user = session?.user;
    const authLoading = authStatus === 'loading';

    // Check Active Commission Status when authenticated
    useEffect(() => {
        if (session?.user) {
            setUserName(session.user.name || '');
            setUserEmail(session.user.email || '');
            checkActiveCommission();
        } else {
            setHasActive(false);
            setUserName('');
            setUserEmail('');
        }
    }, [session]);

    const checkActiveCommission = async () => {
        try {
            const res = await fetch('/api/commissions/check');
            if (res.ok) {
                const data = await res.json();
                setHasActive(data.active);
                if (data.status) {
                    setActiveStatus(data.status);
                }
            }
        } catch (error) {
            console.error('Failed to check active commission status', error);
        }
    };

    // Fetch current pricing tier
    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        fetch('/api/pricing-tier', { signal: controller.signal })
            .then(res => res.json())
            .then(data => {
                clearTimeout(timeoutId);
                if (data.prices) {
                    setCurrentPrices(data.prices);
                }
            })
            .catch(err => {
                clearTimeout(timeoutId);
                if (err.name !== 'AbortError') {
                    console.error('Failed to fetch pricing tier:', err);
                }
                // Fail safe: use Early Access prices (already default state)
            });

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, []);

    // Calculate Estimated Total
    useEffect(() => {
        const basePriceStr = currentPrices[selectedSize as keyof typeof currentPrices];
        if (!basePriceStr) return;

        const basePrice = parseInt(basePriceStr.replace(/[^0-9]/g, ''));

        // Use centralized pricing logic
        const baseTotal = calculatePortraitPrice(basePrice, peopleCount, selectedSize as 'A5' | 'A4' | 'A3');

        const backgroundCost = detailedBackground ? 500 : 0;
        const timelapseCost = timelapse ? 500 : 0;
        const framingCost = framing ? FRAMING_PRICES[selectedSize as 'A5' | 'A4' | 'A3'] : 0;

        // Note: Referrer gets 20% of base + background. Not framing or timelapse.
        setEstimatedTotal(baseTotal + backgroundCost + timelapseCost + framingCost);
    }, [selectedSize, peopleCount, currentPrices, detailedBackground, timelapse, framing]);

    const minDateStr = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    })();

    useEffect(() => {
        const checkStorage = () => {
            if (typeof window === 'undefined') return;

            const code = sessionStorage.getItem('referrer_code');
            const name = sessionStorage.getItem('referrer_name');
            const email = sessionStorage.getItem('referrer_email');
            const phone = sessionStorage.getItem('referrer_phone');

            // If there's an email in storage, compare with current session
            const isSelf = email && user?.email && email.toLowerCase() === user.email.toLowerCase();

            if (isSelf) {
                console.log('Self-referral detected, blocking in UI');
                setIsSelfReferral(true);
                setReferralCode(null);
                setReferrerName(null);
                setReferrerEmail(null);
                setReferrerPhone(null);
                return;
            }

            // Also check if the current user generated this code (using email prefix/pattern if possible, but email is primary)
            setIsSelfReferral(false);
            if (code) setReferralCode(code);
            if (name) setReferrerName(name);
            if (email) setReferrerEmail(email);
            if (phone) setReferrerPhone(phone);
        };

        // Check immediately
        checkStorage();

        // Listen for updates (from ReferralTracker)
        window.addEventListener('referral-updated', checkStorage);
        return () => window.removeEventListener('referral-updated', checkStorage);
    }, [user?.email]);

    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files);
        const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
        if (oversized.length > 0) {
            alert(`These files exceed the 20MB limit and were skipped:\n${oversized.map(f => f.name).join('\n')}`);
        }
        const valid = files.filter(f => f.size <= MAX_FILE_SIZE);
        valid.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachments(prev => [...prev, { name: file.name, content: reader.result as string }]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = ''; // reset so same files can be re-added after removal
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Check Availability
    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const res = await fetch('/api/availability');
                if (res.ok) {
                    const data = await res.json();
                    setAvailability(data.is_accepting_commissions);
                    setStatus(data.status);
                    setImmediateSlotsRemaining(data.immediate_slots_remaining);
                    setWaitlistSlotsRemaining(data.waitlist_slots_remaining);
                }
            } catch (error) {
                console.error('Failed to fetch availability:', error);
                // Fallback to safe defaults
                setAvailability(true);
                setStatus('open');
                setImmediateSlotsRemaining(null);
                setWaitlistSlotsRemaining(null);
            }
        };

        fetchAvailability();
    }, []);

    const uploadToSupabase = async (content: string, fileName: string): Promise<string | null> => {
        try {
            const match = content.match(/^data:([^;]+);base64,(.+)$/);
            if (!match) return null;

            const contentType = match[1];
            const b64Data = match[2];

            const byteCharacters = atob(b64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: contentType });

            const timestamp = Date.now();
            const safeName = fileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
            const filePath = `${timestamp}-${safeName}`;

            const { error: uploadError } = await supabase.storage
                .from('commission')
                .upload(filePath, blob, {
                    contentType,
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('commission')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (err) {
            console.error('Supabase upload failed:', err);
            return null;
        }
    };

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            // Auto-attach referral code from sessionStorage
            const referralCodeStored = sessionStorage.getItem('referrer_code');
            if (referralCodeStored) {
                data.referral_code = referralCodeStored;
            }
            if (referrerName) data.referrer_name = referrerName;
            if (referrerEmail) data.referrer_email = referrerEmail;
            if (referrerPhone) data.referrer_phone = referrerPhone;

            // Upload files to Supabase Storage if they are base64
            let finalFrameImageUrl: string | null = frameConfig?.frameSnapshot || frameConfig?.image || null;
            let frameImageBase64: string | null = null;

            if (finalFrameImageUrl && finalFrameImageUrl.startsWith('data:')) {
                const uploadedUrl = await uploadToSupabase(finalFrameImageUrl, 'frame-design.jpg');
                if (uploadedUrl) {
                    finalFrameImageUrl = uploadedUrl;
                } else {
                    frameImageBase64 = finalFrameImageUrl;
                    finalFrameImageUrl = null;
                }
            }

            const attachment_urls: string[] = [];
            const attachment_base64: { name: string; content: string }[] = [];

            for (const att of attachments) {
                if (att.content.startsWith('data:')) {
                    const uploadedUrl = await uploadToSupabase(att.content, att.name);
                    if (uploadedUrl) {
                        attachment_urls.push(uploadedUrl);
                    } else {
                        attachment_base64.push({ name: att.name, content: att.content });
                    }
                }
            }

            // Send Commission Submission Data
            const res = await fetch('/api/commissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    detailed_background: detailedBackground,
                    timelapse_recording: timelapse,
                    framing: framing,
                    consent: consent,
                    frame_style: frameConfig?.frameStyle ?? null,
                    frame_size: frameConfig?.size ?? null,
                    frame_matting_color: frameConfig?.mattingColor ?? null,
                    frame_matting_size: frameConfig?.mattingSize ?? null,
                    frame_width: frameConfig?.frameWidth ?? null,
                    frame_image: finalFrameImageUrl,
                    frame_image_base64: frameImageBase64,
                    attachment_urls,
                    attachment_base64,
                    razorpay_order_id: data.razorpay_order_id || null,
                    razorpay_payment_id: data.razorpay_payment_id || null,
                    razorpay_signature: data.razorpay_signature || null,
                    payment_type: status === 'waitlist' ? 'reservation' : null,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save commission. Please contact us.');
            }

            setSuccess(true);
        } catch (error: unknown) {
            console.error('Submission error:', error);
            setError((error as Error).message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    // Waitlist specific submit handler with Razorpay
    async function handleWaitlistSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formElement = e.currentTarget; // Capture form element synchronously
        setLoading(true);
        setError('');

        if (!window.Razorpay) {
            setError('Payment system is still loading. Please wait a moment.');
            setLoading(false);
            return;
        }

        const reservationAmount = Math.round(estimatedTotal * 0.25);

        try {
            // 1. Create Order
            const orderRes = await fetch('/api/razorpay/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: reservationAmount,
                    currency: 'INR',
                    receipt: `waitlist_${Date.now()}`
                })
            });

            if (!orderRes.ok) throw new Error('Failed to create payment order');
            const orderData = await orderRes.json();

            // 2. Open Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Atharva Sherlekar Art",
                description: "Waitlist Reservation Fee (25%)",
                order_id: orderData.id,
                handler: async function (response: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string; }) {
                    // Success! Now submit the actual commission form
                    const formData = new FormData(formElement);
                    const data = Object.fromEntries(formData.entries());

                    // Auto-attach referral code from sessionStorage
                    const referralCodeStored = sessionStorage.getItem('referrer_code');
                    if (referralCodeStored) {
                        data.referral_code = referralCodeStored;
                    }
                    if (referrerName) data.referrer_name = referrerName;
                    if (referrerEmail) data.referrer_email = referrerEmail;
                    if (referrerPhone) data.referrer_phone = referrerPhone;

                    // Upload files
                    let finalFrameImageUrl: string | null = frameConfig?.frameSnapshot || frameConfig?.image || null;
                    let frameImageBase64: string | null = null;

                    if (finalFrameImageUrl && finalFrameImageUrl.startsWith('data:')) {
                        const uploadedUrl = await uploadToSupabase(finalFrameImageUrl, 'frame-design.jpg');
                        if (uploadedUrl) finalFrameImageUrl = uploadedUrl;
                        else {
                            frameImageBase64 = finalFrameImageUrl;
                            finalFrameImageUrl = null;
                        }
                    }

                    const attachment_urls: string[] = [];
                    const attachment_base64: { name: string; content: string }[] = [];

                    for (const att of attachments) {
                        if (att.content.startsWith('data:')) {
                            const uploadedUrl = await uploadToSupabase(att.content, att.name);
                            if (uploadedUrl) attachment_urls.push(uploadedUrl);
                            else attachment_base64.push({ name: att.name, content: att.content });
                        }
                    }

                    const res = await fetch('/api/commissions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...data,
                            detailed_background: detailedBackground,
                            timelapse_recording: timelapse,
                            framing: framing,
                            consent: consent,
                            frame_style: frameConfig?.frameStyle ?? null,
                            frame_size: frameConfig?.size ?? null,
                            frame_matting_color: frameConfig?.mattingColor ?? null,
                            frame_matting_size: frameConfig?.mattingSize ?? null,
                            frame_width: frameConfig?.frameWidth ?? null,
                            frame_image: finalFrameImageUrl,
                            frame_image_base64: frameImageBase64,
                            attachment_urls,
                            attachment_base64,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            payment_type: 'reservation'
                        }),
                    });

                    if (!res.ok) {
                        const errorData = await res.json();
                        setError(errorData.error || 'Payment recorded but form failed. PLEASE CONTACT ME with your Payment ID.');
                        setLoading(false);
                    } else {
                        setSuccess(true);
                        setLoading(false);
                    }
                },
                prefill: {
                    name: userName,
                    email: userEmail,
                },
                theme: { color: "#000000" },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error: unknown) {
            console.error('Waitlist payment error:', error);
            setError((error as Error).message || 'Payment initiation failed.');
            setLoading(false);
        }
    }

    if (!availability && !hasActive && !authLoading) {
        return (
            <section id="commission-form" className="py-32 px-6 md:px-12 bg-surface flex flex-col items-center justify-center text-center min-h-[600px] relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative z-10 bg-surface/30 backdrop-blur-md p-10 md:p-14 border border-foreground/10 rounded-xl max-w-lg w-full shadow-2xl"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-16 h-16 mx-auto bg-foreground/5 border border-foreground/10 rounded-full flex items-center justify-center mb-8"
                    >
                        <Lock className="w-6 h-6 text-neutral-400" />
                    </motion.div>

                    <h2 className="font-serif text-3xl md:text-4xl text-foreground uppercase tracking-widest mb-6">
                        Commissions Closed
                    </h2>

                    <p className="text-foreground/80 dark:text-neutral-400 leading-relaxed mb-10 text-sm md:text-base">
                        I am currently fully booked for the next 2 months and not taking new requests at this time. Thank you so much for your interest! Keep an eye on my Instagram for when slots reopen.
                    </p>

                    <a
                        href="https://instagram.com/atharvasherlekarart"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background hover:bg-neutral-200 uppercase tracking-widest font-bold text-sm transition-colors rounded-lg"
                    >
                        <Instagram className="w-4 h-4" />
                        <span>Follow for Updates</span>
                    </a>
                </motion.div>
            </section>
        );
    }

    if (success) {
        return (
            <section id="commission-form" className="py-24 px-6 md:px-12 bg-surface flex flex-col items-center justify-center text-center min-h-[500px]">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-surface p-12 border border-foreground/10 rounded-xl"
                >
                    <CheckCircle className="w-16 h-16 text-accent mx-auto mb-6" />
                    <h2 className="font-serif text-3xl text-foreground uppercase tracking-widest mb-4">
                        {status === 'waitlist' ? 'Added to Waitlist' : 'Request Sent'}
                    </h2>
                    <p className="text-foreground/80 dark:text-neutral-400 max-w-md">
                        {status === 'waitlist'
                            ? "Thank you for joining the waitlist! I am currently working on my maximum of 2 active commissions for this month. Your request is secured in line, and I estimate I will be able to begin working on your piece next month."
                            : "Thank you for your interest. I will review your request and get back to you via email shortly to discuss the process and payment."
                        }
                    </p>
                </motion.div>
            </section>
        );
    }

    return (
        <section id="commission-form" className="py-24 px-6 md:px-12 bg-surface">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="font-serif text-3xl md:text-5xl tracking-widest uppercase">
                        {status === 'waitlist' ? 'Join Waitlist' : 'Commission Request'}
                    </h2>
                    <div className="h-[1px] w-24 bg-foreground/20 mx-auto mt-4" />

                    {/* Live Slots Indicator */}
                    {immediateSlotsRemaining !== null && status === 'open' && immediateSlotsRemaining > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                        >
                            <Flame size={16} className="text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-400">
                                Only {immediateSlotsRemaining} immediate {immediateSlotsRemaining === 1 ? 'slot' : 'slots'} left this month!
                            </span>
                        </motion.div>
                    )}

                    {status === 'waitlist' && (
                        <div className="mt-6 space-y-4 flex flex-col items-center w-full">
                            <div className="p-6 bg-amber-500/5 border border-amber-500/20 text-amber-800 dark:text-amber-200/80 rounded-2xl text-center w-full max-w-2xl">
                                <p className="font-bold mb-2 text-amber-700 dark:text-amber-400 tracking-tight text-lg">High Demand — Slot Reservation Available</p>
                                <p className="text-sm opacity-90 leading-relaxed">
                                    My commission slots are currently full. You can reserve a slot for next month by paying a <strong className="text-amber-900 dark:text-amber-300">25% Slot Reservation Fee</strong>. The remaining 25% advance will be collected when I begin your artwork.
                                </p>
                            </div>

                            {waitlistSlotsRemaining !== null && waitlistSlotsRemaining > 0 && (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-lg shadow-amber-500/10"
                                >
                                    <Clock size={18} className="animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-[0.25em]">
                                        {waitlistSlotsRemaining} waitlist {waitlistSlotsRemaining === 1 ? 'spot' : 'spots'} remaining
                                    </span>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {referralCode && (
                        <div className="mt-4 flex flex-col items-center gap-2">
                            <p className="text-sm text-emerald-400 font-medium bg-emerald-400/10 inline-block px-3 py-1 rounded-full border border-emerald-400/20">
                                Referral Applied: {referralCode}
                            </p>
                            {referrerName && <p className="text-xs text-neutral-500">Referred by {referrerName}</p>}
                        </div>
                    )}

                    {isSelfReferral && (
                        <div className="mt-4 flex flex-col items-center gap-2">
                            <p className="text-sm text-red-400 font-medium bg-red-400/10 inline-block px-3 py-1 rounded-full border border-red-400/20">
                                ⚠ You cannot refer yourself
                            </p>
                        </div>
                    )}
                </div>

                {authLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-neutral-500" size={32} />
                    </div>
                ) : !user ? (
                    <div className="bg-surface border border-foreground/10 p-8 rounded-lg text-center">
                        <h3 className="text-xl text-foreground mb-4">Sign in to request a commission</h3>
                        <p className="text-foreground/80 dark:text-neutral-400 mb-8 max-w-sm mx-auto">
                            To ensure high-quality communication and tracking, please sign in with your Google account.
                        </p>
                        <div className="flex justify-center flex-col items-center gap-4">
                            <GoogleSignInButton />
                        </div>
                    </div>
                ) : hasActive ? (
                    <div className="bg-surface border border-accent/20 p-8 rounded-lg text-center mt-8">
                        {activeStatus === 'accepted' ? (
                            <>
                                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="text-blue-400 w-8 h-8" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-serif text-foreground mb-4 uppercase tracking-widest">Request Accepted</h3>
                                <p className="text-foreground/80 dark:text-neutral-400 mb-6 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                                    Your commission has been <strong>accepted</strong>! Please check your email for the 50% upfront payment instructions. I will start drawing once the payment is confirmed.
                                </p>
                            </>
                        ) : activeStatus === 'in_progress' ? (
                            <>
                                <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Palette className="text-purple-400 w-8 h-8" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-serif text-foreground mb-4 uppercase tracking-widest">Drawing in Progress</h3>
                                <p className="text-foreground/80 dark:text-neutral-400 mb-6 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                                    Your artwork is currently <strong>in progress</strong>! I am working on the drawing now. Once finished, I will send you the final invoice including any add-ons and shipping.
                                </p>
                            </>
                        ) : activeStatus === 'on_delivery' ? (
                            <>
                                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Truck className="text-indigo-400 w-8 h-8" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-serif text-foreground mb-4 uppercase tracking-widest">On Delivery</h3>
                                <p className="text-foreground/80 dark:text-neutral-400 mb-6 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                                    Your artwork is <strong>finished</strong> and being prepared for delivery! Please check your email for the final invoice and shipping updates.
                                </p>
                            </>
                        ) : activeStatus === 'waitlist' ? (
                            <>
                                <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Clock className="text-yellow-400 w-8 h-8" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-serif text-foreground mb-4 uppercase tracking-widest">On Waitlist</h3>
                                <p className="text-foreground/80 dark:text-neutral-400 mb-6 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                                    Your slot has been reserved with a 25% deposit. I am currently working on my maximum of 2 active commissions this month.
                                    When a slot opens up, I will contact you to collect the remaining 25% advance before I begin your piece!
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Hourglass className="text-blue-400 w-8 h-8" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-serif text-foreground mb-4 uppercase tracking-widest">Under Review</h3>
                                <p className="text-foreground/80 dark:text-neutral-400 mb-6 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                                    Your request has been received and is currently under review. Please allow some time for me to go over the details and get back to you!
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <form onSubmit={status === 'waitlist' ? handleWaitlistSubmit : handleSubmit} className="space-y-8">
                        {/* the rest of the form stays inside but needs indentation update visually but we can just leave the tags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Full Name</label>
                                <input required name="name" type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors" placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Email Address</label>
                                <input required name="email" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors" placeholder="john@example.com" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Phone</label>
                                <input required name="phone" type="tel" className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors" placeholder="+91 ..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Instagram ID (Optional)</label>
                                <input name="instagram_id" type="text" className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors" placeholder="@username" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Paper Size</label>
                                {/* Hidden input so the form still submits the size value */}
                                <input type="hidden" name="size" value={selectedSize} />
                                <PaperSizeDropdown
                                    value={selectedSize}
                                    onChange={setSelectedSize}
                                    options={[
                                        { value: 'A5', label: `A5 (${currentPrices.A5}) · Small Tabletop Portrait` },
                                        { value: 'A4', label: `A4 (${currentPrices.A4}) · Best for Couples & Fanart` },
                                        { value: 'A3', label: `A3 (${currentPrices.A3}) · Grand Portrait · Best for Groups` },
                                    ]}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Number of People in Reference/Artwork</label>

                                {/* Hidden Input for Form Submission */}
                                <input type="hidden" name="number_of_people" value={peopleCount} />

                                <div className="flex items-center w-full bg-surface border border-foreground/10 rounded-md overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                                        className="p-4 hover:bg-foreground/10 transition-colors border-r border-foreground/10 active:bg-foreground/20 touch-manipulation min-w-[60px] flex items-center justify-center"
                                        aria-label="Decrease count"
                                    >
                                        <Minus size={20} className="text-foreground" />
                                    </button>

                                    <div className="flex-1 text-center font-serif text-xl text-foreground select-none py-4">
                                        {peopleCount}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setPeopleCount(Math.min(10, peopleCount + 1))}
                                        className="p-4 hover:bg-foreground/10 transition-colors border-l border-foreground/10 active:bg-foreground/20 touch-manipulation min-w-[60px] flex items-center justify-center"
                                        aria-label="Increase count"
                                    >
                                        <Plus size={20} className="text-foreground" />
                                    </button>
                                </div>

                                {/* Discount Nudge Pill */}
                                {(selectedSize === 'A4' || selectedSize === 'A3') && peopleCount === 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-3"
                                    >
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300">
                                            <Flame size={14} className="flex-shrink-0" />
                                            <span className="text-xs font-medium">Add a 2nd face for 50% off — make it a group portrait!</span>
                                        </div>
                                    </motion.div>
                                )}
                                {(selectedSize === 'A4' || selectedSize === 'A3') && peopleCount >= 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-3"
                                    >
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                                            <Sparkles size={14} className="flex-shrink-0" />
                                            <span className="text-xs font-medium">Group discount applied — each extra face at 50% off!</span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Date Needed By (Optional)</label>
                            <input
                                name="needed_by"
                                type="date"
                                min={minDateStr}
                                className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors"
                            />
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                                ⏳ Portraits typically take <strong>1-2 weeks</strong>. Requesting a date earlier than 7 days from today is disabled to set realistic expectations.
                            </p>
                        </div>

                        {/* Add-ons Section */}
                        <div className="space-y-4">
                            <label className="text-xs uppercase tracking-widest text-neutral-500 block">Add-ons</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className={`
                                flex items-center p-4 border rounded-md cursor-pointer transition-all
                                ${detailedBackground ? 'bg-foreground/10 border-accent' : 'bg-surface border-foreground/10 hover:border-foreground/30'}
                            `}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={detailedBackground}
                                        onChange={(e) => setDetailedBackground(e.target.checked)}
                                    />
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${detailedBackground ? 'border-accent bg-accent text-background' : 'border-neutral-500'}`}>
                                        {detailedBackground && <CheckCircle size={14} />}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-foreground">Detailed Background (+₹500)</span>
                                            <div className="relative group ml-2">
                                                <button
                                                    type="button"
                                                    className="text-neutral-400 hover:text-foreground focus:outline-none"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setShowBackgroundInfo(!showBackgroundInfo);
                                                    }}
                                                    aria-label="More information about detailed background"
                                                >
                                                    <Info size={16} />
                                                </button>

                                                {/* Desktop Tooltip */}
                                                <div className="absolute hidden lg:group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface border border-foreground/10 text-foreground text-xs p-3 rounded-lg shadow-xl z-20 pointer-events-none">
                                                    Includes complex elements like buildings, specific landscapes, vehicles, or intricate patterns. Simple blurred or plain shading in the background is included for free.
                                                </div>
                                            </div>
                                        </div>
                                        {/* Mobile Expandable Text */}
                                        <motion.div
                                            initial={false}
                                            animate={{ height: showBackgroundInfo ? 'auto' : 0, opacity: showBackgroundInfo ? 1 : 0 }}
                                            className="overflow-hidden lg:hidden"
                                        >
                                            <p className="text-xs text-neutral-400 mt-2">
                                                Includes complex elements like buildings, specific landscapes, vehicles, or intricate patterns. Simple blurred or plain shading in the background is included for free.
                                            </p>
                                        </motion.div>
                                    </div>
                                </label>

                                <label className={`
                                flex items-center p-4 border rounded-md cursor-pointer transition-all
                                ${timelapse ? 'bg-foreground/10 border-accent' : 'bg-surface border-foreground/10 hover:border-foreground/30'}
                            `}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={timelapse}
                                        onChange={(e) => setTimelapse(e.target.checked)}
                                    />
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${timelapse ? 'border-accent bg-accent text-background' : 'border-neutral-500'}`}>
                                        {timelapse && <CheckCircle size={14} />}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-foreground">Timelapse Recording (+₹500)</span>
                                            <div className="relative group ml-2">
                                                <button
                                                    type="button"
                                                    className="text-neutral-400 hover:text-foreground focus:outline-none"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setShowTimelapseInfo(!showTimelapseInfo);
                                                    }}
                                                    aria-label="More information about timelapse recording"
                                                >
                                                    <Info size={16} />
                                                </button>
                                                {/* Desktop Tooltip */}
                                                <div className="absolute hidden lg:group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface border border-foreground/10 text-foreground text-xs p-3 rounded-lg shadow-xl z-20 pointer-events-none">
                                                    A high-quality, edited video of your portrait coming to life from start to finish. Perfect for sharing on social media or as a keepsake!
                                                </div>
                                            </div>
                                        </div>
                                        {/* Mobile Expandable Text */}
                                        <motion.div
                                            initial={false}
                                            animate={{ height: showTimelapseInfo ? 'auto' : 0, opacity: showTimelapseInfo ? 1 : 0 }}
                                            className="overflow-hidden lg:hidden"
                                        >
                                            <p className="text-xs text-neutral-400 mt-2">
                                                A high-quality, edited video of your portrait coming to life from start to finish. Perfect for sharing on social media or as a keepsake!
                                            </p>
                                        </motion.div>
                                    </div>
                                </label>

                                <label className={`
                                flex items-center p-4 border rounded-md cursor-pointer transition-all md:col-span-2
                                ${framing ? 'bg-foreground/10 border-accent' : 'bg-surface border-foreground/10 hover:border-foreground/30'}
                            `}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={framing}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setFraming(isChecked);
                                            if (!isChecked) {
                                                setFrameConfig(null);
                                            }
                                        }}
                                    />
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${framing ? 'border-accent bg-accent text-background' : 'border-neutral-500'}`}>
                                        {framing && <CheckCircle size={14} />}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-foreground">Framing (+₹{FRAMING_PRICES[selectedSize as 'A5' | 'A4' | 'A3']})</span>
                                            <div className="relative group ml-2">
                                                <button
                                                    type="button"
                                                    className="text-neutral-400 hover:text-foreground focus:outline-none"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setShowFramingInfo(!showFramingInfo);
                                                    }}
                                                    aria-label="More information about framing"
                                                >
                                                    <Info size={16} />
                                                </button>
                                                {/* Desktop Tooltip */}
                                                <div className="absolute hidden lg:group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface border border-foreground/10 text-foreground text-xs p-3 rounded-lg shadow-xl z-20 pointer-events-none">
                                                    Professional framing for your artwork. Customize to fit your space exactly!
                                                </div>
                                            </div>
                                        </div>
                                        {/* Mobile Expandable Text */}
                                        <motion.div
                                            initial={false}
                                            animate={{ height: showFramingInfo ? 'auto' : 0, opacity: showFramingInfo ? 1 : 0 }}
                                            className="overflow-hidden lg:hidden"
                                        >
                                            <p className="text-xs text-neutral-400 mt-2">
                                                Professional framing for your artwork. Customize to fit your space exactly!
                                            </p>
                                        </motion.div>
                                    </div>
                                </label>
                            </div>

                            {/* Customize Your Frame Button */}
                            {framing && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-3"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setShowFrameModal(true)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all group ${frameConfig
                                            ? 'border-accent/50 bg-accent/5'
                                            : 'border-dashed border-foreground/20 hover:border-accent/40 hover:bg-accent/5'
                                            }`}
                                    >
                                        <div className="p-2 rounded-lg bg-accent/10 group-hover:scale-105 transition-transform">
                                            <Frame size={20} className="text-accent" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-semibold text-foreground text-sm">
                                                {frameConfig ? '✓ Frame Customized' : 'Customize Your Frame'}
                                            </p>
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                {frameConfig
                                                    ? `${frameConfig.size} · ${frameConfig.frameStyle.replace('-', ' ')} · matting ${frameConfig.mattingSize}px`
                                                    : 'Preview frame styles, matting & sizing before you order'}
                                            </p>
                                        </div>
                                        <span className="text-xs text-accent font-medium shrink-0">
                                            {frameConfig ? 'Edit' : 'Open →'}
                                        </span>
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {/* Pricing Breakdown */}
                        <motion.div
                            key={estimatedTotal}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-foreground/5 border border-foreground/10 rounded-lg overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-6 pt-5 pb-3">
                                <p className="text-xs uppercase tracking-widest text-neutral-500">Artwork Subtotal</p>
                            </div>

                            {/* Line Items */}
                            <div className="px-6 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-neutral-400">
                                        Base ({selectedSize}, {peopleCount} {peopleCount === 1 ? 'person' : 'people'})
                                    </span>
                                    <span className="font-mono text-foreground">
                                        ₹{calculatePortraitPrice(parseInt((currentPrices[selectedSize as keyof typeof currentPrices] || '₹500').replace(/[^0-9]/g, '')), peopleCount, selectedSize as 'A5' | 'A4' | 'A3').toLocaleString()}
                                    </span>
                                </div>
                                {detailedBackground && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">+ Detailed Background</span>
                                        <span className="font-mono text-foreground">₹500</span>
                                    </div>
                                )}
                                {timelapse && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">+ Timelapse Recording</span>
                                        <span className="font-mono text-foreground">₹500</span>
                                    </div>
                                )}
                                {framing && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">+ Framing</span>
                                        <span className="font-mono text-foreground">₹{FRAMING_PRICES[selectedSize as 'A5' | 'A4' | 'A3']}</span>
                                    </div>
                                )}
                            </div>

                            {/* Subtotal */}
                            <div className="mx-6 mt-3 pt-3 border-t border-foreground/10 flex justify-between items-baseline">
                                <span className="text-sm text-foreground font-medium">Subtotal</span>
                                <span className="text-2xl font-serif text-foreground">₹{estimatedTotal.toLocaleString()}</span>
                            </div>

                            {/* Deposit & Balance */}
                            <div className="mx-6 mt-4 pt-3 border-t border-foreground/10 space-y-2 text-sm">
                                {status === 'waitlist' ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-accent font-medium">Slot Reservation Fee (25%)</span>
                                            <span className="font-mono text-accent font-bold">₹{Math.round(estimatedTotal * 0.25).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-400">Remaining Advance (25%, due when work begins)</span>
                                            <span className="font-mono text-neutral-400">₹{Math.round(estimatedTotal * 0.25).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-400">Balance Due (on completion)</span>
                                            <span className="font-mono text-neutral-400">₹{Math.round(estimatedTotal * 0.5).toLocaleString()} + Shipping</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-accent font-medium">Booking Deposit (50%)</span>
                                            <span className="font-mono text-accent font-bold">₹{Math.round(estimatedTotal / 2).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-400">Balance Due</span>
                                            <span className="font-mono text-neutral-400">₹{Math.round(estimatedTotal / 2).toLocaleString()} + Shipping</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Shipping Note */}
                            <div className="px-6 pt-3 pb-5">
                                <p className="text-[11px] text-neutral-500 italic leading-relaxed">
                                    Shipping costs will be calculated and added to the final balance once the portrait is ready for delivery.
                                </p>
                            </div>
                        </motion.div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-neutral-500">Shipping Address</label>
                            <textarea required name="address" rows={3} className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors" placeholder="Full address with pincode" />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                Reference Photos
                                <span className="text-red-400 font-bold">*</span>
                                <span className="text-neutral-600">(Required · Max 20MB each · Multiple allowed)</span>
                            </label>
                            <input
                                name="reference_images"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-background hover:file:bg-accent/80"
                            />
                            {attachments.length > 0 && (
                                <ul className="space-y-2 mt-2">
                                    {attachments.map((att, i) => (
                                        <li key={i} className="flex items-center justify-between bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2 text-sm">
                                            <span className="text-foreground truncate flex-1 mr-2">📎 {att.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(i)}
                                                className="text-neutral-500 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                                                aria-label={`Remove ${att.name}`}
                                            >
                                                <X size={14} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {attachments.length === 0 && (
                                <p className="text-xs text-red-400/80">⚠ At least one reference photo is required.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-neutral-500">Additional Notes</label>
                            <textarea name="notes" rows={3} className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors" placeholder="Any specific requests or deadline..." />
                        </div>

                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                        {/* Consent Checkbox */}
                        <div className="pt-4 border-t border-foreground/10">
                            <label className="flex items-start cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={consent}
                                    onChange={(e) => setConsent(e.target.checked)}
                                />
                                <div className={`w-5 h-5 rounded border mt-0.5 flex-shrink-0 flex items-center justify-center mr-3 transition-colors ${consent ? 'border-accent bg-accent text-background' : 'border-neutral-500 group-hover:border-foreground/50'}`}>
                                    {consent && <CheckCircle size={14} />}
                                </div>
                                <span className="text-sm text-neutral-400">
                                    I consent to having the completed drawing uploaded to the artist&apos;s Instagram page.
                                    <span className="block text-xs mt-1 text-neutral-500">(Note: Timelapse recordings, if selected, are kept private and sent only to you unless explicit permission is granted.)</span>
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || attachments.length === 0 || (status === 'waitlist' && !razorpayLoaded)}
                            className="w-full bg-foreground text-background font-bold uppercase tracking-widest py-4 rounded-lg hover:bg-neutral-200 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : status === 'waitlist' ? (
                                <>Pay ₹{Math.round(estimatedTotal * 0.25)} & Join Waitlist</>
                            ) : (
                                'Submit Request'
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* Frame Customizer Modal */}
            <AnimatePresence>
                {showFrameModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
                        onWheel={(e) => e.stopPropagation()}
                        onClick={(e) => { if (e.target === e.currentTarget) setShowFrameModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="bg-background border border-foreground/10 rounded-2xl md:rounded-3xl w-full max-w-6xl h-[96dvh] md:h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
                        >
                            <div className="flex-none sticky top-0 z-10 bg-background/95 backdrop-blur-sm flex items-center justify-between px-3 md:px-6 py-2 md:py-4 border-b border-foreground/10">
                                <div>
                                    <h3 className="font-serif text-sm md:text-lg uppercase tracking-widest">Frame Designer</h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">Your choices will be included with your commission order</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowFrameModal(false)}
                                    className="p-2 rounded-xl hover:bg-foreground/10 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-0 md:p-6">
                                <ArtVisualizer
                                    className="flex-1 min-h-0 flex flex-col h-full"
                                    embedded
                                    forcedSize={selectedSize as 'A5' | 'A4' | 'A3'}
                                    initialConfig={frameConfig || undefined}
                                    onFrameIt={(config) => {
                                        setFrameConfig(config);
                                        setTimeout(() => setShowFrameModal(false), 1200);
                                    }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setRazorpayLoaded(true)}
            />
        </section >
    );
}
