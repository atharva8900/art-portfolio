'use client';

import { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Plus, Minus, Lock, Instagram, Clock, Palette, Truck, Hourglass, Info, ChevronDown, Check, Flame, Sparkles, Frame, X, ShieldAlert } from 'lucide-react';

import { calculatePortraitPrice, FRAMING_PRICES } from '@/lib/utils/pricing';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase/client';
import AuthOptions from '@/components/auth/AuthOptions';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import ArtVisualizer, { FrameConfig } from '@/components/features/ArtVisualizer';
import SafeTurnstile, { type SafeTurnstileHandle } from '@/components/shared/SafeTurnstile';
import { loadRazorpay } from '@/lib/load-razorpay';
import type { OfferData } from '@/lib/db/offers';





const REF_LOCK_KEY = 'atharva_referral_lock';

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


// Removed manual createClient() call here, we use the exported singleton instead.

export default function CommissionForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [availability, setAvailability] = useState(true);
    const [status, setStatus] = useState<'open' | 'waitlist' | 'closed' | 'loading' | null>(null);
    const [immediateSlotsRemaining, setImmediateSlotsRemaining] = useState<number | null>(null);
    const [waitlistSlotsRemaining, setWaitlistSlotsRemaining] = useState<number | null>(null);
    const [closureReason, setClosureReason] = useState<string | null>(null);
    const [reopenDate, setReopenDate] = useState<string | null>(null);
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
    const [currentPrices, setCurrentPrices] = useState({ A5: '₹499', A4: '₹999', A3: '₹1999', A2: '₹3999' });
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
    const turnstileRef = useRef<SafeTurnstileHandle>(null);
    const [fingerprintHash, setFingerprintHash] = useState<string | null>(null);
    const [banStatus, setBanStatus] = useState<'muted' | 'banned' | null>(null);
    const [banExpiresAt, setBanExpiresAt] = useState<string | null>(null);
    const [banCheckDone, setBanCheckDone] = useState(false);
    const [submittedAtOverride, setSubmittedAtOverride] = useState<string>('');

    const isAdmin = session?.user?.email ? ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com'].includes(session.user.email.toLowerCase()) : false;

    // Load FingerprintJS on mount and capture the visitor ID
    useEffect(() => {
        import('@fingerprintjs/fingerprintjs').then(FingerprintJS => {
            FingerprintJS.load().then(fp => {
                fp.get().then(result => {
                    setFingerprintHash(result.visitorId);
                });
            });
        }).catch(() => {
            // Non-fatal: fingerprinting is best-effort
            setBanCheckDone(true); // unblock if fingerprint fails
        });
    }, []);

    // After fingerprint loads, check ban/mute status
    useEffect(() => {
        if (!fingerprintHash) return;
        const userEmail = session?.user?.email ?? null;
        fetch('/api/commissions/check-ban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint_hash: fingerprintHash, user_email: userEmail })
        })
            .then(r => r.json())
            .then(data => {
                if (data.restricted) {
                    setBanStatus(data.status);
                    setBanExpiresAt(data.expires_at ?? null);
                }
            })
            .catch(() => { /* fail open */ })
            .finally(() => setBanCheckDone(true));
    }, [fingerprintHash, session?.user?.email]);

    const [estimatedTotal, setEstimatedTotal] = useState<number>(0);
    const [originalTotalValue, setOriginalTotalValue] = useState<number>(0);
    const [totalSavings, setTotalSavings] = useState<number>(0);
    const [promoCodes, setPromoCodes] = useState<string[]>(['', '', '']);
    const [offers, setOffers] = useState<(OfferData | null)[]>([null, null, null]);
    const [offerErrors, setOfferErrors] = useState<string[]>(['', '', '']);
    const [isValidatingPromos, setIsValidatingPromos] = useState<boolean[]>([false, false, false]);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
// (Removed showTurnstile state as SafeTurnstile handles it internally)
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
    const [offerAppliedMessages, setOfferAppliedMessages] = useState<string[]>(['', '', '']);
    const originalBodyOverflow = useRef('');
    const publicOfferFetched = useRef(false);



    const handleTurnstileSuccess = useCallback((token: string) => {
        setTurnstileToken(token);
    }, []);


    // Background Scroll Lock for Frame Modal
    useEffect(() => {
        if (showFrameModal) {
            // Store current overflow
            originalBodyOverflow.current = document.body.style.overflow;
            // Lock background
            document.body.style.overflow = 'hidden';
            // Also handle mobile touch-action to prevent background scrolling
            document.body.style.touchAction = 'none';
        } else {
            // Restore overflow
            document.body.style.overflow = originalBodyOverflow.current || 'auto';
            document.body.style.touchAction = 'auto';
        }

        return () => {
            document.body.style.overflow = originalBodyOverflow.current || 'auto';
            document.body.style.touchAction = 'auto';
        };
    }, [showFrameModal]);

    // Promo Validation
    const validatePromo = useCallback(async (code: string, index: number) => {
        if (!code) {
            setOffers(prev => { const newArr = [...prev]; newArr[index] = null; return newArr; });
            setOfferErrors(prev => { const newArr = [...prev]; newArr[index] = ''; return newArr; });
            setOfferAppliedMessages(prev => { const newArr = [...prev]; newArr[index] = ''; return newArr; });
            return;
        }
        setIsValidatingPromos(prev => { const newArr = [...prev]; newArr[index] = true; return newArr; });
        setOfferErrors(prev => { const newArr = [...prev]; newArr[index] = ''; return newArr; });
        setOfferAppliedMessages(prev => { const newArr = [...prev]; newArr[index] = ''; return newArr; });
        
        const country = new URLSearchParams(window.location.search).get('country');
        const query = country ? `?country=${country}` : '';
        try {
            const res = await fetch(`/api/offers/validate${query}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.toUpperCase(), fingerprint: fingerprintHash })
            });
            const data = await res.json();
            if (res.ok && data.valid) {
                // Check if already applied in another slot
                if (offers.some((o, i) => i !== index && o?.id === data.offer.id)) {
                    setOffers(prev => { const newArr = [...prev]; newArr[index] = null; return newArr; });
                    setOfferErrors(prev => { const newArr = [...prev]; newArr[index] = 'Offer already applied'; return newArr; });
                } else {
                    setOffers(prev => { const newArr = [...prev]; newArr[index] = data.offer; return newArr; });
                    setOfferAppliedMessages(prev => { const newArr = [...prev]; newArr[index] = `Offer Applied: ${data.offer.name}`; return newArr; });
                    setPromoCodes(prev => { const newArr = [...prev]; newArr[index] = code.toUpperCase(); return newArr; });
                }
            } else {
                setOffers(prev => { const newArr = [...prev]; newArr[index] = null; return newArr; });
                setOfferErrors(prev => { const newArr = [...prev]; newArr[index] = data.error || 'Invalid or expired offer code'; return newArr; });
            }
        } catch {
            setOfferErrors(prev => { const newArr = [...prev]; newArr[index] = 'Failed to validate code'; return newArr; });
        } finally {
            setIsValidatingPromos(prev => { const newArr = [...prev]; newArr[index] = false; return newArr; });
        }
    }, [offers, fingerprintHash]);

    // Auto-validate from URL promo (runs once on mount)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const promo = params.get('promo');
        if (promo) {
            setPromoCodes(prev => { const newArr = [...prev]; newArr[0] = promo; return newArr; });
            validatePromo(promo, 0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch public offer when commissions are verified as 'open'
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const promo = params.get('promo');
        
        console.log('[OFFER DEBUG] Effect triggered. Status:', status, 'Promo from URL:', promo, 'Already Fetched:', publicOfferFetched.current);

        if (status !== 'open') {
            if (status === null) console.log('[OFFER DEBUG] Status is still null, waiting for availability check...');
            else console.log('[OFFER DEBUG] Status is not open (currently:', status + '), skipping public offer fetch.');
            return;
        }

        if (promo) {
            console.log('[OFFER DEBUG] Skipping public fetch because specific promo exists in URL:', promo);
            return;
        }

        if (publicOfferFetched.current) {
            console.log('[OFFER DEBUG] Public offer already fetched or fetch initiated.');
            return;
        }

        const country = new URLSearchParams(window.location.search).get('country');
        const countryQuery = country ? `&country=${country}` : '';
        fetch(`/api/offers/public?t=${Date.now()}${countryQuery}`)
            .then(res => {
                console.log('[OFFER DEBUG] API Response Status:', res.status);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log('[OFFER DEBUG] Received data:', data);
                if (data.offer) {
                    console.log('[OFFER DEBUG] Applying public offer:', data.offer.code);
                    setOffers([data.offer, null, null]);
                    setPromoCodes([data.offer.code, '', '']);
                    setOfferAppliedMessages([`${data.offer.expires_at ? 'Limited Time' : 'Special'} Offer: ${data.offer.name}`, '', '']);
                } else {
                    console.log('[OFFER DEBUG] No valid public offer returned by server.');
                }
            })
            .catch(err => {
                console.error('[OFFER DEBUG] Fetch failed:', err);
                publicOfferFetched.current = false; // allow retry on network failure
            });
    }, [status]);


    // Countdown Timer Logic
    useEffect(() => {
        const expiringOfferIndex = offers.findIndex(o => o && o.expires_at);
        const expiringOffer = expiringOfferIndex !== -1 ? offers[expiringOfferIndex] : null;

        if (!expiringOffer?.expires_at) {
            setTimeLeft(null);
            return;
        }

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(expiringOffer.expires_at as string | number | Date).getTime() - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft(null);
                setOffers(prev => { const newArr = [...prev]; newArr[expiringOfferIndex] = null; return newArr; });
                setOfferErrors(prev => { const newArr = [...prev]; newArr[expiringOfferIndex] = 'Offer has expired'; return newArr; });
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [offers]);

    const user = session?.user;
    const authLoading = authStatus === 'loading';

    // Check Active Commission Status when authenticated
    const checkActiveCommission = useCallback(async () => {
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
    }, []);

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
    }, [session?.user, checkActiveCommission]); // Specific dependencies to prevent loop

    // Unified self-referral detection moved to checkStorage within useEffect below to avoid conflicts.
    // This allows us to handle "Obvious" vs "Hidden" flagging consistently.


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
        let baseTotal = calculatePortraitPrice(basePrice, peopleCount, selectedSize as 'A5' | 'A4' | 'A3' | 'A2');

        // Apply Offer Discount on Base Price
        let hasFreeBackground = false;
        let hasFreeTimelapse = false;
        let hasFreeFraming = false;

        for (const offer of offers) {
            if (offer && offer.discount_percent) {
                baseTotal = baseTotal * (1 - offer.discount_percent / 100);
            }
            if (offer?.free_extras?.background) hasFreeBackground = true;
            if (offer?.free_extras?.timelapse) hasFreeTimelapse = true;
            if (offer?.free_extras?.framing) hasFreeFraming = true;
        }

        const backgroundCost = (detailedBackground && !hasFreeBackground) ? 499 : 0;
        const timelapseCost = (timelapse && !hasFreeTimelapse) ? 499 : 0;
        const framingCost = (framing && !hasFreeFraming) ? FRAMING_PRICES[selectedSize as 'A5' | 'A4' | 'A3' | 'A2'] : 0;

        // Note: Delivery is usually handled in shipping, but if free_extras.delivery is true, that's a bonus
        const total = baseTotal + backgroundCost + timelapseCost + framingCost;

        // Calculate original total (without any discounts)
        const originalBaseTotal = calculatePortraitPrice(basePrice, peopleCount, selectedSize as 'A5' | 'A4' | 'A3' | 'A2');
        const originalBackgroundCost = detailedBackground ? 499 : 0;
        const originalTimelapseCost = timelapse ? 499 : 0;
        const originalFramingCost = framing ? FRAMING_PRICES[selectedSize as 'A5' | 'A4' | 'A3' | 'A2'] : 0;
        const originalTotal = originalBaseTotal + originalBackgroundCost + originalTimelapseCost + originalFramingCost;

        setEstimatedTotal(Math.round(total));
        setOriginalTotalValue(Math.round(originalTotal));
        setTotalSavings(Math.round(originalTotal - total));
    }, [selectedSize, peopleCount, currentPrices, detailedBackground, timelapse, framing, offers]);

    const minDateStr = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
    })();

    useEffect(() => {
        const checkStorage = () => {
            if (typeof window === 'undefined') return;

            const storedReferral = sessionStorage.getItem('referrer_code');
            const lockPresent = localStorage.getItem(REF_LOCK_KEY) === 'true';

            // Distinct flags for "Obvious" vs "Hidden" detection
            const name = sessionStorage.getItem('referrer_name');
            const email = sessionStorage.getItem('referrer_email');
            const phone = sessionStorage.getItem('referrer_phone');

            // 1. OBVIOUS: Same account match (Show explicit warning)
            const isEmailMatch = email && user?.email && email.trim().toLowerCase() === user.email.trim().toLowerCase();
            
            if (isEmailMatch) {
                // Obvious same-account match: Show yellow warning, Block referral
                setIsSelfReferral(true);
                setReferralCode(null);
                localStorage.setItem(REF_LOCK_KEY, 'true');
                return;
            }

            if (lockPresent) {
                // Hidden/Device match: SILENT flagging
                // We keep warning hidden and visually "Apply" the referral to avoid tipping them off
                setIsSelfReferral(false);
                if (storedReferral) setReferralCode(storedReferral);
                return;
            }

            // Norml Flow
            setIsSelfReferral(false);
            if (storedReferral) setReferralCode(storedReferral);
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
        
        let files = Array.from(e.target.files);
        
        if (attachments.length + files.length > 6) {
            alert(`You can only upload a maximum of 6 reference photos. The remaining files were skipped.`);
            files = files.slice(0, Math.max(0, 6 - attachments.length));
        }

        if (files.length === 0) {
            e.target.value = '';
            return;
        }

        const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
        if (oversized.length > 0) {
            alert(`These files exceed the 20MB limit and were skipped:\n${oversized.map(f => f.name).join('\n')}`);
        }
        const valid = files.filter(f => f.size <= MAX_FILE_SIZE);
        valid.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachments(prev => {
                    if (prev.length >= 6) return prev;
                    return [...prev, { name: file.name, content: reader.result as string }];
                });
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
                    console.log('[OFFER DEBUG] Availability status confirmed:', data.status);
                    setStatus(data.status);
                    setImmediateSlotsRemaining(data.immediate_slots_remaining);
                    setWaitlistSlotsRemaining(data.waitlist_slots_remaining);
                    setClosureReason(data.closure_reason);
                    setReopenDate(data.reopen_date);
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
            const country = new URLSearchParams(window.location.search).get('country');
            const countryQuery = country ? `?country=${country}` : '';
            const res = await fetch(`/api/commissions${countryQuery}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    promo_ids: offers.filter(o => o !== null).map(o => o.id),
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
                    referral_locked_browser: localStorage.getItem(REF_LOCK_KEY) === 'true',
                    turnstile_token: turnstileToken,
                    fingerprint_hash: fingerprintHash,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                let errorMessage = errorData.error || 'Failed to save commission. Please contact us.';
                if (errorData.details && Array.isArray(errorData.details)) {
                    const detailMessages = errorData.details.map((d: { path: (string | number)[]; message: string }) => `${d.path.join('.')}: ${d.message}`).join(', ');
                    errorMessage = `Validation Error: ${detailMessages}`;
                }
                throw new Error(errorMessage);
            }

            const responseData = await res.json();
            if (responseData.success && responseData.referral) {
                // Only show "Obvious" warning if emails match. 
                // Browser lock remains silent here to avoid giving it away after submission.
                if (session?.user?.email === responseData.referral.referrer_email) {
                setIsSelfReferral(true);
                }
                // Ensure lock is set for next time
                localStorage.setItem(REF_LOCK_KEY, 'true');
            }

            setSuccess(true);
        } catch (error: unknown) {
            console.error('Submission error:', error);
            setError((error as Error).message || 'Something went wrong. Please try again.');
            turnstileRef.current?.reset();
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

        let Razorpay: Awaited<ReturnType<typeof loadRazorpay>>;
        try {
            Razorpay = await loadRazorpay();
        } catch {
            setError('Could not load the payment SDK. Check your connection and try again.');
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
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
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

                    const country = new URLSearchParams(window.location.search).get('country');
                    const countryQuery = country ? `?country=${country}` : '';
                    const res = await fetch(`/api/commissions${countryQuery}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...data,
                            promo_ids: offers.filter(o => o !== null).map(o => o.id),
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
                            payment_type: 'reservation',
                            turnstile_token: turnstileToken,
                            referral_locked_browser: localStorage.getItem(REF_LOCK_KEY) === 'true',
                            fingerprint_hash: fingerprintHash,
                        }),
                    });

                    if (!res.ok) {
                        const errorData = await res.json();
                        setError(errorData.error || 'Payment recorded but form failed. PLEASE CONTACT ME with your Payment ID.');
                        setLoading(false);
                        turnstileRef.current?.reset();
                    } else {
                        setSuccess(true);
                        setLoading(false);
                        // Lock the browser for any future self-referrals
                        localStorage.setItem(REF_LOCK_KEY, 'true');
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
                        turnstileRef.current?.reset();
                    }
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error: unknown) {
            console.error('Waitlist payment error:', error);
            setError((error as Error).message || 'Payment initiation failed.');
            setLoading(false);
            turnstileRef.current?.reset();
        }
    }

    // ── Restriction Gate ────────────────────────────────────────────────────
    if (banCheckDone && banStatus) {
        const isMuted = banStatus === 'muted';
        return (
            <section id="commission-form" className="py-32 px-6 md:px-12 bg-surface flex flex-col items-center justify-center text-center min-h-[600px] relative overflow-hidden">
                {/* Background glow */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${isMuted ? 'bg-orange-500/5' : 'bg-red-500/5'} rounded-full blur-[100px] pointer-events-none`} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative z-10 p-10 md:p-14 border rounded-3xl max-w-md w-full shadow-2xl text-left ${
                        isMuted
                            ? 'bg-orange-500/5 border-orange-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                    }`}
                >
                    {/* Title */}
                    <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-3 ${
                        isMuted ? 'text-orange-400/60' : 'text-red-500/60'
                    }`}>
                        {isMuted ? 'Temporary Restriction' : 'Permanent Restriction'}
                    </p>
                    <h2 className="font-serif text-3xl text-foreground mb-4">
                        {isMuted ? 'Your Account is Muted' : 'Your Account is Banned'}
                    </h2>

                    {/* Reason block */}
                    <div className={`p-4 rounded-xl border mb-6 ${
                        isMuted ? 'bg-orange-500/5 border-orange-500/10' : 'bg-red-500/5 border-red-500/10'
                    }`}>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-1">Reason</p>
                        <p className="text-sm text-foreground/80">False form submission</p>
                    </div>

                    {/* Expiry (mute only) */}
                    {isMuted && banExpiresAt && (
                        <div className="flex items-center gap-3 mb-6 text-orange-400">
                            <Clock size={16} className="shrink-0" />
                            <p className="text-sm">
                                Restriction lifts on:{' '}
                                <strong>
                                    {new Date(banExpiresAt).toLocaleDateString('en-GB', {
                                        day: 'numeric', month: 'long', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </strong>
                            </p>
                        </div>
                    )}

                    {/* Divider */}
                    <div className={`h-px mb-6 ${ isMuted ? 'bg-orange-500/10' : 'bg-red-500/10'}`} />

                    {/* CTA */}
                    <p className="text-sm text-neutral-400 mb-5">
                        Think this is a mistake? Send us a{' '}
                        <strong className="text-foreground">Direct Message on Instagram</strong> and we&apos;ll look into it.
                    </p>
                    <a
                        href="https://instagram.com/atharva_sherlekar_art"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-sm transition-all ${
                            isMuted
                                ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
                                : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                        }`}
                    >
                        <Instagram size={16} />
                        @atharva_sherlekar_art
                    </a>
                </motion.div>
            </section>
        );
    }

    if (!availability && !hasActive && !authLoading) {
        return (
            <section id="commission-form" className="py-32 px-6 md:px-12 bg-surface flex flex-col items-center justify-center text-center min-h-[600px] relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
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
                        {closureReason || "I am currently fully booked and not taking new requests at this time. Thank you so much for your interest! Keep an eye on my Instagram for when slots reopen."}
                    </p>

                    {reopenDate && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-lg text-accent text-sm font-bold uppercase tracking-widest flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
                        >
                            <span>Estimated Reopening:</span>
                            <div className="flex items-center gap-2">
                                <span>{new Date(reopenDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                <span className="opacity-40 hidden md:block">|</span>
                                <span className="text-white/90 bg-white/10 px-2 py-0.5 rounded flex items-center gap-1.5">
                                    <Clock size={12} className="shrink-0" />
                                    {new Date(reopenDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    <a
                        href="https://instagram.com/atharva_sherlekar_art"
                        target="_blank"
                        rel="noopener noreferrer"
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
                    <Link
                        href="/client/dashboard"
                        className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-neutral-200 transition-colors uppercase tracking-widest font-bold text-sm"
                    >
                        Check Commission Dashboard
                    </Link>
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

                    {/* Offer Urgency & Countdown */}
                    <AnimatePresence>
                        {offers[0] && status === 'open' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-8 p-8 bg-neutral-50 dark:bg-neutral-900 border border-black/5 dark:border-accent/20 rounded-[2.5rem] shadow-2xl relative overflow-hidden group"
                            >
                                {/* Decorative elements */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-[60px] group-hover:bg-accent/20 transition-all" />
                                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/5 rounded-full blur-[60px]" />

                                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform text-accent">
                                    <Sparkles size={48} />
                                </div>

                                <div className="relative z-10 flex flex-col items-center gap-6">
                                    <div className="flex items-center gap-2 px-5 py-2 bg-accent text-background rounded-full text-[11px] font-black uppercase tracking-[0.25em] shadow-lg shadow-accent/20">
                                        <Flame size={14} className="animate-pulse" />
                                        {offers.filter(Boolean).length > 1 ? `${offers.filter(Boolean).length} Offers Applied` : (offers[0]?.expires_at ? 'Limited Time Offer Applied' : 'Special Offer Applied')}
                                    </div>

                                    <div className="text-center space-y-2">
                                        <h3 className="text-3xl font-serif text-neutral-900 dark:text-white">
                                            {offers.filter((o): o is OfferData => Boolean(o)).length > 1
                                                ? offers.filter((o): o is OfferData => Boolean(o)).map(o => o.name).join(' + ')
                                                : offers[0]?.name || ''}
                                        </h3>
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold opacity-80">
                                            {offers.filter((o): o is OfferData => Boolean(o)).length > 1
                                                ? `CODES: ${offers.filter((o): o is OfferData => Boolean(o)).map(o => o.code).join(', ')}`
                                                : `OFFER CODE : ${offers[0]?.code || 'OFFER CODE'}`}
                                        </p>
                                    </div>

                                    {(offers[0]?.note as string) && (
                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic text-center leading-relaxed max-w-xs">
                                            {offers[0].note as string}
                                        </p>
                                    )}

                                    {((offers[0]?.discount_percent as number) ?? 0) > 0 ? (
                                        <div className="flex items-center gap-12 py-6 px-10 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-black/5 dark:border-white/10 w-full justify-center relative overflow-hidden group/benefit">
                                            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover/benefit:opacity-100 transition-opacity" />

                                            <div className="text-center relative z-10">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-black mb-2 px-3 py-0.5 bg-accent/10 rounded-full inline-block">Benefit</p>
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className="text-5xl md:text-6xl font-cinzel text-neutral-900 dark:text-white leading-none drop-shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{offers[0]?.discount_percent as number ?? 0}</span>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-2xl font-cinzel text-accent leading-none">%</span>
                                                        <span className="text-[10px] uppercase font-black tracking-tighter text-accent/60 leading-none mt-1">OFF</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-[1px] h-16 bg-black/10 dark:bg-white/10 relative z-10" />

                                            <div className="text-center relative z-10">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-2">Availability</p>
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className="text-4xl font-cinzel text-neutral-900 dark:text-white">{offers[0]?.usage_count as number ?? 0}</span>
                                                    <span className="text-lg font-cinzel text-neutral-500">/</span>
                                                    <span className="text-lg font-cinzel text-neutral-500">{offers[0]?.usage_limit as number ?? 0}</span>
                                                </div>
                                                <p className="text-[9px] uppercase font-black tracking-widest text-neutral-600 mt-1">Spots Claimed</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-6 px-10 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-black/5 dark:border-white/10 w-full relative overflow-hidden group/benefit">
                                            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover/benefit:opacity-100 transition-opacity" />
                                            <div className="text-center relative z-10">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-2">Availability</p>
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className="text-4xl font-cinzel text-neutral-900 dark:text-white">{offers[0]?.usage_count as number ?? 0}</span>
                                                    <span className="text-lg font-cinzel text-neutral-500">/</span>
                                                    <span className="text-lg font-cinzel text-neutral-500">{offers[0]?.usage_limit as number ?? 0}</span>
                                                </div>
                                                <p className="text-[9px] uppercase font-black tracking-widest text-neutral-600 mt-1">Spots Claimed</p>
                                            </div>
                                        </div>
                                    )}

                                    {timeLeft && (
                                        <div className="flex flex-col items-center gap-3">
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">Offer Expires In</p>
                                            <div className="flex gap-4">
                                                {[
                                                    { label: 'days', value: timeLeft.days },
                                                    { label: 'hrs', value: timeLeft.hours },
                                                    { label: 'mins', value: timeLeft.minutes },
                                                    { label: 'secs', value: timeLeft.seconds }
                                                ].map((t, i) => (
                                                    <div key={i} className="flex flex-col items-center gap-1">
                                                        <div className="w-14 h-14 bg-neutral-100 dark:bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-bold border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white shadow-inner">
                                                            {String(t.value).padStart(2, '0')}
                                                        </div>
                                                        <span className="text-[9px] uppercase tracking-tighter font-black text-neutral-500">{t.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {offers.some(o => o && o.free_extras && Object.values(o.free_extras).some(Boolean)) && (
                                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                                            {offers.filter((o): o is OfferData => Boolean(o)).flatMap(o =>
                                                Object.entries(o.free_extras || {}).filter(([, val]) => Boolean(val)).map(([key]) => (
                                                    <div key={`${o.id}-${key}`} className="flex items-center gap-2 bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20">
                                                        <Check size={12} className="text-accent" />
                                                        <span className="text-[10px] uppercase font-bold tracking-widest text-accent">
                                                            Free {key} {(key === 'delivery' && (o.only_india_delivery || (o as unknown as { delivery_restricted?: boolean }).delivery_restricted)) && '(India Only)'}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {authLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-neutral-500" size={32} />
                    </div>
                ) : !user ? (
                    <div className="bg-surface border border-foreground/10 p-8 rounded-lg text-center">
                        <h3 className="text-xl text-foreground mb-4">Sign in to request a commission</h3>
                        <AuthOptions
                            description="To ensure high-quality communication and tracking, please sign in with Google or use your email to receive a passwordless secure login link."
                        />
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
                        <Link
                            href="/client/dashboard"
                            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-neutral-200 transition-colors uppercase tracking-widest font-bold text-sm"
                        >
                            Check Commission Dashboard
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={status === 'waitlist' ? handleWaitlistSubmit : handleSubmit} className="space-y-8">
                        {isAdmin && (
                            <div className="bg-orange-500/10 border border-orange-500/30 p-6 rounded-lg space-y-3 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                                <h4 className="text-orange-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                    <ShieldAlert size={14} /> Admin Tools: Backdate Submission
                                </h4>
                                <div className="space-y-2 relative z-10">
                                    <label htmlFor="submitted_at" className="text-xs uppercase tracking-widest text-neutral-400 font-medium">Custom Submission Date</label>
                                    <input 
                                        id="submitted_at" 
                                        name="submitted_at" 
                                        type="datetime-local" 
                                        value={submittedAtOverride}
                                        onChange={(e) => setSubmittedAtOverride(e.target.value)}
                                        className="w-full bg-surface/50 border border-orange-500/20 p-4 rounded-md text-foreground focus:border-orange-500 outline-none transition-colors" 
                                    />
                                    <p className="text-[10px] text-neutral-500">Leave blank to use the current date and time. Only visible to admins.</p>
                                </div>
                            </div>
                        )}
                        {/* the rest of the form stays inside but needs indentation update visually but we can just leave the tags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="full_name" className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Full Name</label>
                                <input required id="full_name" name="name" type="text" value={userName} onChange={(e) => setUserName(e.target.value)} autoComplete="name" className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors" placeholder="Your Full Name" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium flex items-center justify-between">
                                    <span>Email Address</span>
                                    {user && <span className="text-[9px] text-accent flex items-center gap-1"><Lock size={10} /> VERIFIED</span>}
                                </label>
                                <input 
                                    required 
                                    id="email" 
                                    name="email" 
                                    type="email" 
                                    value={userEmail} 
                                    onChange={(e) => !user && setUserEmail(e.target.value)} 
                                    readOnly={!!user}
                                    autoComplete="email" 
                                    className={`w-full bg-surface border p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors ${
                                        user 
                                            ? 'border-accent/30 bg-accent/5 opacity-80 cursor-not-allowed text-neutral-400' 
                                            : 'border-foreground/10 hover:border-foreground/30'
                                    }`} 
                                    placeholder="john@example.com" 
                                />
                                {user && (
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                                        Locked to your signed-in account
                                    </p>
                                )}
                            </div>

                            {/* Promo Code Inputs (Max 3) */}
                            <div className="space-y-4 md:col-span-2">
                                <label className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Promo Codes (Up to 3)</label>
                                {[0, 1, 2].map(index => (
                                    <div key={index} className="flex flex-col gap-1">
                                        <div className="flex gap-2">
                                            <input
                                                id={`promo_code_${index}`}
                                                name={`promo_code_${index}`}
                                                type="text"
                                                value={promoCodes[index]}
                                                onChange={(e) => {
                                                    const newCodes = [...promoCodes];
                                                    newCodes[index] = e.target.value.toUpperCase();
                                                    setPromoCodes(newCodes);
                                                }}
                                                autoComplete="off"
                                                placeholder={index === 0 ? "HAVE A CODE?" : `CODE ${index + 1} (OPTIONAL)`}
                                                className={`flex-1 bg-surface border ${offers[index] ? 'border-emerald-500/50' : 'border-foreground/10'} p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors font-mono tracking-widest placeholder:text-neutral-500`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => validatePromo(promoCodes[index], index)}
                                                disabled={isValidatingPromos[index] || !promoCodes[index]}
                                                className="px-6 py-4 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-md text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                                            >
                                                {isValidatingPromos[index] ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                                            </button>
                                        </div>
                                        {offerErrors[index] && <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest px-1">{offerErrors[index]}</p>}
                                        {offers[index] && <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest px-1 flex items-center gap-1"><Check size={10} /> {offerAppliedMessages[index]}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Phone</label>
                                <input required id="phone" name="phone" type="tel" autoComplete="tel" className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors" placeholder="+91 ... (Required for delivery)" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="instagram_id" className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Instagram ID</label>
                                <input id="instagram_id" name="instagram_id" type="text" autoComplete="off" className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors" placeholder="@username (Optional)" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="paper_size_select" className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Paper Size</label>
                                {/* Hidden input so the form still submits the size value */}
                                <input id="paper_size_select" type="hidden" name="size" value={selectedSize} />
                                <PaperSizeDropdown
                                    value={selectedSize}
                                    onChange={setSelectedSize}
                                    options={[
                                        { value: 'A5', label: `A5 (${currentPrices.A5}) · Small Tabletop Portrait` },
                                        { value: 'A4', label: `A4 (${currentPrices.A4}) · Best for Couples & Fanart` },
                                        { value: 'A3', label: `A3 (${currentPrices.A3}) · Large Portrait · Good for Detailed Artwork` },
                                        { value: 'A2', label: `A2 (${currentPrices.A2 || '₹3999'}) · Grand Portrait · Best for Group Portraits` },
                                    ]}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="number_of_people" className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Number of People in Reference/Artwork</label>

                                {/* Hidden Input for Form Submission */}
                                <input id="number_of_people" type="hidden" name="number_of_people" value={peopleCount} />

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
                                {(selectedSize === 'A4' || selectedSize === 'A3' || selectedSize === 'A2') && peopleCount === 1 && (
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
                                {(selectedSize === 'A4' || selectedSize === 'A3' || selectedSize === 'A2') && peopleCount >= 2 && (
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
                            <label htmlFor="needed_by" className="text-xs uppercase tracking-widest text-neutral-600 dark:text-neutral-500 font-medium">Date Needed By (Optional)</label>
                            <input
                                id="needed_by"
                                name="needed_by"
                                type="date"
                                min={minDateStr}
                                className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors"
                            />
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                                ⏳ Portraits typically take <strong>2-4 weeks</strong>. Requesting a date earlier than 14 days from today is disabled to set realistic expectations.
                            </p>
                        </div>

                        {/* Add-ons Section */}
                        <div className="space-y-4">
                            <label className="text-xs uppercase tracking-widest text-neutral-500 block">Add-ons</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label htmlFor="detailed_background" className={`
                                flex items-center p-4 border rounded-md cursor-pointer transition-all
                                ${detailedBackground ? 'bg-foreground/10 border-accent' : 'bg-surface border-foreground/10 hover:border-foreground/30'}
                            `}>
                                    <input
                                        id="detailed_background"
                                        type="checkbox"
                                        className="hidden"
                                        checked={detailedBackground}
                                        onChange={(e) => setDetailedBackground(e.target.checked)}
                                    />
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition-all ${detailedBackground ? 'border-foreground bg-foreground text-background shadow-lg' : 'border-neutral-500'}`}>
                                        {detailedBackground && <CheckCircle size={14} className="stroke-[3px]" />}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-foreground">
                                                Detailed Background {offers.some(o => o?.free_extras?.background) ? <span className="text-accent font-bold ml-1">(FREE)</span> : <span className="text-neutral-500 ml-1">(+₹500)</span>}
                                            </span>
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

                                <label htmlFor="timelapse_recording" className={`
                                flex items-center p-4 border rounded-md cursor-pointer transition-all
                                ${timelapse ? 'bg-foreground/10 border-accent' : 'bg-surface border-foreground/10 hover:border-foreground/30'}
                            `}>
                                    <input
                                        id="timelapse_recording"
                                        type="checkbox"
                                        className="hidden"
                                        checked={timelapse}
                                        onChange={(e) => setTimelapse(e.target.checked)}
                                    />
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition-all ${timelapse ? 'border-foreground bg-foreground text-background shadow-lg' : 'border-neutral-500'}`}>
                                        {timelapse && <CheckCircle size={14} className="stroke-[3px]" />}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-foreground">
                                                Timelapse Recording {offers.some(o => o?.free_extras?.timelapse) ? <span className="text-accent font-bold ml-1">(FREE)</span> : <span className="text-neutral-500 ml-1">(+₹500)</span>}
                                            </span>
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

                                <label htmlFor="framing" className={`
                                flex items-center p-4 border rounded-md cursor-pointer transition-all md:col-span-2
                                ${framing ? 'bg-foreground/10 border-accent' : 'bg-surface border-foreground/10 hover:border-foreground/30'}
                            `}>
                                    <input
                                        id="framing"
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
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition-all ${framing ? 'border-foreground bg-foreground text-background shadow-lg' : 'border-neutral-500'}`}>
                                        {framing && <CheckCircle size={14} className="stroke-[3px]" />}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-foreground">
                                                Framing {offers.some(o => o?.free_extras?.framing) ? <span className="text-accent font-bold ml-1">(FREE)</span> : <span className="text-neutral-500 ml-1">(+₹{FRAMING_PRICES[selectedSize as 'A5' | 'A4' | 'A3' | 'A2']})</span>}
                                            </span>
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
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-400">
                                        Base ({selectedSize}, {peopleCount} {peopleCount === 1 ? 'person' : 'people'})
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {offers.some(o => o && (o.discount_percent ?? 0) > 0) && (
                                            <span className="text-[10px] line-through text-neutral-500 font-mono">
                                                ₹{calculatePortraitPrice(parseInt((currentPrices[selectedSize as keyof typeof currentPrices] || '₹500').replace(/[^0-9]/g, '')), peopleCount, selectedSize as 'A5' | 'A4' | 'A3' | 'A2').toLocaleString()}
                                            </span>
                                        )}
                                        {offers.map((offer, i) => offer && (offer.discount_percent ?? 0) > 0 ? (
                                            <span key={i} className="font-mono text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20 font-bold">
                                                -{offer.discount_percent}%
                                            </span>
                                        ) : null)}
                                        <span className={`font-mono ${offers.some(o => o && (o.discount_percent ?? 0) > 0) ? 'text-accent font-bold' : 'text-foreground'}`}>
                                            ₹{Math.round(calculatePortraitPrice(parseInt((currentPrices[selectedSize as keyof typeof currentPrices] || '₹500').replace(/[^0-9]/g, '')), peopleCount, selectedSize as 'A5' | 'A4' | 'A3' | 'A2') * offers.reduce((acc, o) => acc * (o ? (1 - (o.discount_percent ?? 0) / 100) : 1), 1)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                {detailedBackground && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">+ Detailed Background</span>
                                        <span className={`font-mono ${offers.some(o => o?.free_extras?.background) ? 'text-accent font-bold' : 'text-foreground'}`}>
                                            {offers.some(o => o?.free_extras?.background) ? 'FREE' : '₹500'}
                                        </span>
                                    </div>
                                )}
                                {timelapse && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">+ Timelapse Recording</span>
                                        <span className={`font-mono ${offers.some(o => o?.free_extras?.timelapse) ? 'text-accent font-bold' : 'text-foreground'}`}>
                                            {offers.some(o => o?.free_extras?.timelapse) ? 'FREE' : '₹500'}
                                        </span>
                                    </div>
                                )}
                                {framing && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">+ Framing</span>
                                        <span className={`font-mono ${offers.some(o => o?.free_extras?.framing) ? 'text-accent font-bold' : 'text-foreground'}`}>
                                            {offers.some(o => o?.free_extras?.framing) ? 'FREE' : `₹${FRAMING_PRICES[selectedSize as 'A5' | 'A4' | 'A3' | 'A2']}`}
                                        </span>
                                    </div>
                                )}
                                {offers.some(o => o?.free_extras?.delivery) && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis mr-2">+ Delivery (Shipping)</span>
                                        <span className="font-mono text-accent font-bold whitespace-nowrap shrink-0">
                                            FREE {offers.some(o => o?.free_extras?.delivery && (o?.only_india_delivery || o?.delivery_restricted)) && '(INDIA ONLY)'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Regional Delivery Restriction Notice */}
                            {offers.some(o => o?.delivery_restricted) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mx-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 mb-2"
                                >
                                    <div className="p-1.5 rounded-lg bg-amber-500/20 shrink-0">
                                        <Truck size={14} className="text-amber-500" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">Regional Advantage Locked</p>
                                        <p className="text-[10px] text-neutral-400 leading-relaxed">
                                            Free Delivery on one or more offers is restricted to <span className="text-neutral-200 font-bold">India only</span>. Your region will be billed standard shipping.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Subtotal */}
                            <div className="mx-6 mt-3 pt-3 border-t border-foreground/10 flex justify-between items-baseline">
                                <div className="flex flex-col">
                                    <span className="text-sm text-foreground font-medium">Subtotal</span>
                                    {totalSavings > 0 && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1"
                                        >
                                            <Sparkles size={10} /> You Save ₹{totalSavings.toLocaleString()}
                                        </motion.span>
                                    )}
                                </div>
                                <div className="flex flex-col items-end">
                                    {totalSavings > 0 && (
                                        <span className="text-xs line-through text-neutral-500 font-mono mb-[-4px]">
                                            ₹{originalTotalValue.toLocaleString()}
                                        </span>
                                    )}
                                    <span className="text-2xl font-serif text-foreground">₹{estimatedTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Deposit & Balance */}
                            <div className="mx-6 mt-4 pt-3 border-t border-foreground/10 space-y-2 text-sm">
                                {status === 'waitlist' ? (
                                    (() => {
                                        const resFee = Math.round(estimatedTotal * 0.25);
                                        const advFee = Math.round(estimatedTotal * 0.25);
                                        const balDue = estimatedTotal - resFee - advFee;
                                        return (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-accent font-medium">Slot Reservation Fee (25%)</span>
                                                    <span className="font-mono text-accent font-bold">₹{resFee.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-400">Remaining Advance (25%, due when work begins)</span>
                                                    <span className="font-mono text-neutral-400">₹{advFee.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-400">Balance Due (on completion)</span>
                                                    <span className="font-mono text-neutral-400">₹{balDue.toLocaleString()} {offers.some(o => o?.free_extras?.delivery) ? '(incl. Shipping)' : '+ Shipping'}</span>
                                                </div>
                                            </>
                                        );
                                    })()
                                ) : (
                                    (() => {
                                        const deposit = Math.round(estimatedTotal / 2);
                                        const balance = estimatedTotal - deposit;
                                        return (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-accent font-medium">Booking Deposit (50%)</span>
                                                    <span className="font-mono text-accent font-bold">₹{deposit.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-400">Balance Due</span>
                                                    <span className="font-mono text-neutral-400">₹{balance.toLocaleString()} {offers.some(o => o?.free_extras?.delivery) ? '(incl. Shipping)' : '+ Shipping'}</span>
                                                </div>
                                            </>
                                        );
                                    })()
                                )}
                            </div>

                            {/* Shipping Note */}
                            <div className="px-6 pt-3 pb-5">
                                <p className="text-[11px] text-neutral-500 italic leading-relaxed">
                                    {offers.some(o => o?.free_extras?.delivery)
                                        ? "Your offer includes free shipping! No additional delivery costs will be charged."
                                        : "Shipping costs will be calculated and added to the final balance once the portrait is ready for delivery."
                                    }
                                </p>
                            </div>
                        </motion.div>

                        <div className="space-y-2">
                            <label htmlFor="shipping_address" className="text-xs uppercase tracking-widest text-neutral-500">Shipping Address</label>
                            <textarea id="shipping_address" required name="address" rows={3} autoComplete="street-address" className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors" placeholder="Full address with pincode" />
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="reference_photos" className="text-xs uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                Reference Photos
                                <span className="text-red-400 font-bold">*</span>
                                <span className="text-neutral-600">(Required · Max 20MB each · Max 6 photos)</span>
                            </label>
                            <input
                                id="reference_photos"
                                name="reference_images"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-foreground file:text-background hover:file:bg-foreground/90"
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
                            <label htmlFor="additional_notes" className="text-xs uppercase tracking-widest text-neutral-500">Additional Notes</label>
                            <textarea id="additional_notes" name="notes" rows={3} autoComplete="off" className="w-full bg-surface border border-foreground/10 p-4 rounded-md text-foreground focus:border-accent outline-none transition-colors" placeholder="Any specific requests, deadlines, or links to more reference photos..." />
                        </div>

                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                        {/* Consent Checkbox */}
                        <div className="pt-4 border-t border-foreground/10">
                            <label htmlFor="consent_checkbox" className="flex items-start cursor-pointer group">
                                <input
                                    id="consent_checkbox"
                                    type="checkbox"
                                    className="hidden"
                                    checked={consent}
                                    onChange={(e) => setConsent(e.target.checked)}
                                />
                                <div className={`w-5 h-5 rounded border mt-0.5 flex-shrink-0 flex items-center justify-center mr-3 transition-all ${consent ? 'border-foreground bg-foreground text-background' : 'border-neutral-500 group-hover:border-foreground/50'}`}>
                                    {consent && <CheckCircle size={14} className="stroke-[3px]" />}
                                </div>
                                <span className="text-sm text-foreground/90 font-medium transition-colors">
                                    I consent to having the completed drawing uploaded to the artist&apos;s Instagram page.
                                    <span className="block text-xs mt-1 text-neutral-500 dark:text-neutral-400 font-normal">(Note: Timelapse recordings, if selected, are kept private and sent only to you unless explicit permission is granted.)</span>
                                </span>
                            </label>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence>
                            <div className="flex justify-center items-center overflow-hidden">
                                <SafeTurnstile
                                    ref={turnstileRef}
                                    onSuccess={handleTurnstileSuccess}
                                />
                            </div>
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={loading ||
                                    attachments.length === 0 ||
                                    (!turnstileToken)}
                                className="w-full bg-neutral-400 text-background font-black uppercase tracking-[0.2em] py-5 rounded-xl hover:bg-neutral-200 transition-all duration-300 disabled:opacity-30 disabled:hover:bg-neutral-400 shadow-xl flex items-center justify-center"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : status === 'waitlist' ? (
                                    <>Pay ₹{Math.round(estimatedTotal * 0.25).toLocaleString()} & Join Waitlist</>
                                ) : (
                                    'Submit Request'
                                )}
                            </button>
                        </div>
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
                                    forcedSize={selectedSize as 'A5' | 'A4' | 'A3' | 'A2'}
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

        </section >
    );
}

