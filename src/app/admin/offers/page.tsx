'use client';

import { useState, useEffect } from 'react';
import {
    Loader2, Copy, Users, Check, Lock, MousePointer2,
    QrCode, X, Plus, Percent, Trash2, Calendar, Clock
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AdminNav from '@/components/admin/AdminNav';
import ClockTimePicker from '@/components/admin/ClockTimePicker';
import { QRCodeSVG } from 'qrcode.react';

interface OfferData {
    id: string;
    code: string;
    name: string;
    discount_percent: number;
    usage_limit: number;
    usage_count: number;
    click_count: number;
    expires_at: string | null;
    free_extras: {
        delivery?: boolean;
        timelapse?: boolean;
        background?: boolean;
        framing?: boolean;
    };
    is_active: boolean;
    is_public: boolean;
    created_at: string;
}

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com'];

export default function AdminOffersPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [offers, setOffers] = useState<OfferData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showCreateOffer, setShowCreateOffer] = useState(false);
    const [fullscreenQRCode, setFullscreenQRCode] = useState<{ id: string, name: string, code: string } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    // Auth Logic
    const userEmail = session?.user?.email;
    const isAuthorized = !!session && !!userEmail && ALLOWED_EMAILS.includes(userEmail.toLowerCase());

    useEffect(() => {
        if (isAuthorized) {
            fetchOffers();
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [isAuthorized, status]);

    const fetchOffers = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/offers');
            if (!res.ok) {
                if (res.status === 401) return;
                throw new Error('Failed to fetch offers');
            }
            const data = await res.json();
            const sorted = (data.offers || []).sort((a: OfferData, b: OfferData) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setOffers(sorted);
        } catch (error: unknown) {
            const err = error as { message?: string };
            setError(err.message || 'Failed to load offers');
        } finally {
            setLoading(false);
        }
    };

    const executeDeleteOffer = async () => {
        if (!offerToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/offers/${offerToDelete}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete offer');
            setOffers((prev) => prev.filter((o) => o.id !== offerToDelete));
            showNotification('Offer successfully deleted', 'success');
        } catch {
            showNotification('Failed to delete offer', 'error');
        } finally {
            setIsDeleting(false);
            setOfferToDelete(null);
        }
    };

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={48} />
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-4">
                <div className="bg-surface border border-foreground/10 p-8 rounded-xl max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <Lock size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif text-foreground mb-2">Unauthorized Access</h1>
                        <p className="text-neutral-400">You do not have permission to view this page.</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-3 bg-foreground text-background font-bold rounded hover:bg-neutral-200 transition-colors w-full"
                    >
                        Go to Home / Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground px-4 md:px-8 lg:px-12 selection:bg-accent/30 flex flex-col">
            <AdminNav />
            <div className="max-w-7xl mx-auto w-full space-y-10 pt-10 pb-20 mt-16 md:mt-24 flex-1 flex flex-col">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4 shrink-0">
                    <div>
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-accent text-[10px] uppercase tracking-[0.3em] font-bold mb-2 block"
                        >
                            Active Offers
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-serif tracking-wide"
                        >
                            Offer Link Generator
                        </motion.h1>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setShowCreateOffer(true)}
                            className="bg-accent text-background px-6 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-accent/20"
                        >
                            <Plus size={16} />
                            Create New Offer
                        </motion.button>

                        <div className="bg-surface border border-foreground/5 rounded-2xl px-6 py-3 flex items-center justify-between gap-6 shadow-xl">
                            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                                Active Offers
                            </span>
                            <span className="font-cinzel text-xl text-foreground">
                                {offers.filter(o => o.is_active).length}
                            </span>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl shrink-0">
                        {error}
                    </div>
                ) : loading && offers.length === 0 ? (
                    <div className="flex items-center justify-center py-40 flex-1">
                        <Loader2 className="animate-spin text-accent" size={32} />
                    </div>
                ) : (
                    <OfferListView
                        offers={offers}
                        onDelete={(id) => setOfferToDelete(id)}
                        onShowQR={(offer) => setFullscreenQRCode(offer)}
                        showNotification={showNotification}
                    />
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {offerToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface border border-foreground/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6"
                        >
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                                    <Trash2 size={24} />
                                </div>
                                <h3 className="text-xl font-serif text-foreground">
                                    Delete Offer
                                </h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    Are you sure you want to permanently delete this offer? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-foreground/5">
                                <button
                                    onClick={() => setOfferToDelete(null)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 rounded-full border border-foreground/10 text-foreground font-bold text-sm hover:bg-foreground/5 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeDeleteOffer}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 rounded-full bg-red-500 text-foreground font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                                >
                                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Offer Modal */}
            <AnimatePresence>
                {showCreateOffer && (
                    <CreateOfferModal
                        onClose={() => setShowCreateOffer(false)}
                        onSuccess={() => {
                            setShowCreateOffer(false);
                            fetchOffers();
                            showNotification('Offer created successfully');
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Fullscreen QR Modal */}
            <AnimatePresence>
                {fullscreenQRCode && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl">
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setFullscreenQRCode(null)}
                            className="absolute top-8 right-8 p-3 rounded-full bg-foreground/10 text-foreground hover:bg-foreground/20 transition-all"
                        >
                            <X size={24} />
                        </motion.button>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-serif">{fullscreenQRCode.name}</h2>
                                <p className="font-mono text-accent text-xl tracking-[0.3em]">{fullscreenQRCode.code}</p>
                            </div>

                            <div className="bg-white p-12 rounded-[3rem] shadow-2xl">
                                <QRCodeSVG
                                    value={`${window.location.origin}?promo=${fullscreenQRCode.code}`}
                                    size={400}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}?promo=${fullscreenQRCode.code}`;
                                    navigator.clipboard.writeText(url);
                                    showNotification('Offer link copied');
                                }}
                                className="px-8 py-4 bg-accent text-background rounded-2xl font-bold uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
                            >
                                <Copy size={18} />
                                Copy Offer URL
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Notification Toast */}
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 50, x: '-50%' }}
                    className={`fixed bottom-8 left-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold shadow-2xl ${notification.type === 'error' ? 'bg-red-500 text-foreground' : 'bg-emerald-500 text-foreground'
                        }`}
                >
                    <Check size={16} />
                    {notification.message}
                </motion.div>
            )}

            {/* Background Texture Blur */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-background">
                <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>
        </div>
    );
}

function OfferListView({ offers, onDelete, onShowQR, showNotification }: {
    offers: OfferData[],
    onDelete: (id: string) => void,
    onShowQR: (offer: { id: string, name: string, code: string }) => void,
    showNotification: (m: string) => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            {offers.length === 0 ? (
                <div className="col-span-full text-center py-20 text-neutral-500 bg-surface border border-foreground/5 rounded-3xl">
                    <QrCode size={48} className="opacity-20 mx-auto mb-4" />
                    <p className="uppercase tracking-widest text-xs">No active offers yet</p>
                </div>
            ) : (
                offers.map((offer) => (
                    <div key={offer.id} className="bg-surface border border-foreground/5 rounded-3xl p-6 space-y-4 hover:border-accent/20 transition-all group shadow-xl">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h3 className="font-serif text-xl flex items-center gap-2">
                                    {offer.name}
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${offer.is_public !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-500/20 text-neutral-400'}`}>
                                        {offer.is_public !== false ? 'Public' : 'Private'}
                                    </span>
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-accent text-xs font-bold uppercase tracking-wider">{offer.code}</span>
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}?promo=${offer.code}`;
                                            navigator.clipboard.writeText(url);
                                            showNotification('Offer link copied');
                                        }}
                                        className="text-neutral-500 hover:text-foreground transition-colors"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => onDelete(offer.id)}
                                className="p-2 rounded-full bg-red-500/5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-foreground"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-foreground/5">
                            <div className="space-y-1">
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Discount</p>
                                <p className="font-cinzel text-lg text-emerald-400">{offer.discount_percent}% OFF</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Usage</p>
                                <p className="font-cinzel text-lg">{offer.usage_count} / {offer.usage_limit}</p>
                            </div>
                        </div>

                        {offer.expires_at && (
                            <div className="flex items-center justify-between p-3 bg-red-500/5 rounded-2xl border border-red-500/10">
                                <div className="flex items-center gap-2 text-red-400/80">
                                    <Clock size={12} />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Expires</span>
                                </div>
                                <span className="font-mono text-[11px] font-bold text-neutral-300">
                                    {new Date(offer.expires_at).toLocaleDateString('en-GB')} {new Date(offer.expires_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-3 bg-foreground/5 rounded-2xl">
                            <div className="flex items-center gap-2 text-neutral-400">
                                <MousePointer2 size={12} />
                                <span className="text-[10px] uppercase font-bold tracking-widest">Total Clicks</span>
                            </div>
                            <span className="font-mono font-bold text-accent">{offer.click_count}</span>
                        </div>

                        <button
                            onClick={() => onShowQR({ id: offer.id, name: offer.name, code: offer.code })}
                            className="pt-4 flex items-center justify-center bg-white rounded-2xl p-4 border border-foreground/10 w-full hover:scale-[1.02] transition-transform cursor-zoom-in"
                        >
                            <QRCodeSVG
                                value={`${window.location.origin}?promo=${offer.code}`}
                                size={120}
                                level="M"
                                includeMargin={true}
                                imageSettings={{
                                    src: "/logo.png",
                                    x: undefined,
                                    y: undefined,
                                    height: 24,
                                    width: 24,
                                    excavate: true,
                                }}
                            />
                        </button>
                    </div>
                ))
            )}
        </motion.div>
    );
}

function CreateOfferModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [showClockPicker, setShowClockPicker] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        discount_percent: 10,
        usage_limit: 3,
        expiry_date: '',
        expiry_time: '23:59',
        free_extras: {
            delivery: false,
            timelapse: false,
            background: false,
            framing: false
        },
        is_public: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    code: formData.code.toUpperCase(),
                    discount_percent: formData.discount_percent,
                    usage_limit: formData.usage_limit,
                    free_extras: formData.free_extras,
                    is_public: formData.is_public,
                    is_active: true,
                    // Append +05:30 so the time is always treated as IST before converting to UTC
                    expires_at: formData.expiry_date
                        ? new Date(`${formData.expiry_date}T${formData.expiry_time || '23:59'}:00+05:30`).toISOString()
                        : null
                })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || `Server error: ${res.status}`);
            }
            onSuccess();
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to create offer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl"
            onWheel={(e) => e.stopPropagation()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-surface border border-foreground/10 rounded-[2rem] p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-scroll overscroll-contain custom-scrollbar"
                onWheel={(e) => { e.stopPropagation(); }}
                onTouchMove={(e) => e.stopPropagation()}
            >
                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(181, 153, 94, 0.4);
                    }
                `}</style>
                <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-foreground/5 transition-colors text-neutral-500">
                    <X size={20} />
                </button>

                <div className="space-y-5">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-serif">Create New Offer</h2>
                        <p className="text-neutral-400 text-xs italic">Define your unique promotional parameters</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 px-2">Offer Name</label>
                                <input
                                    required
                                    placeholder="e.g. IG Story Flash Sale"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-5 py-3.5 focus:border-accent outline-none transition-all placeholder:text-neutral-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 px-2">Promo Code</label>
                                <input
                                    required
                                    placeholder="e.g. FLASH50"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-5 py-3.5 focus:border-accent outline-none transition-all placeholder:text-neutral-600 font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 px-2">Discount (%)</label>
                                <div className="relative">
                                    <Percent size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.discount_percent}
                                        onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) })}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl pl-12 pr-5 py-3.5 focus:border-accent outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 px-2">Usage Limit</label>
                                <div className="relative">
                                    <Users size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.usage_limit}
                                        onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })}
                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl pl-12 pr-5 py-3.5 focus:border-accent outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 px-2">Expiry Date & Time (Optional)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={formData.expiry_date}
                                            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                            className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl pl-10 pr-4 py-3.5 focus:border-accent outline-none transition-all text-neutral-300 [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                                        {/* Custom Clock Picker trigger */}
                                        <button
                                            type="button"
                                            onClick={() => setShowClockPicker(true)}
                                            className="w-full text-left bg-foreground/5 border border-foreground/10 rounded-2xl pl-10 pr-4 py-3.5 focus:border-accent outline-none transition-all text-neutral-300 hover:border-foreground/30"
                                        >
                                            {formData.expiry_time}
                                        </button>
                                    </div>

                                    {/* Clock picker overlay */}
                                    {showClockPicker && (
                                        <ClockTimePicker
                                            value={formData.expiry_time}
                                            onClose={() => setShowClockPicker(false)}
                                            onConfirm={(t: string) => {
                                                setFormData({ ...formData, expiry_time: t });
                                                setShowClockPicker(false);
                                            }}
                                        />
                                    )}
                                </div>
                                {formData.expiry_date && (
                                    <div className="mt-1 flex items-center gap-2 px-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                        <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                                            Expiry Format: <span className="text-foreground">
                                                {new Date(`${formData.expiry_date}T${formData.expiry_time || '23:59'}:00`).toLocaleDateString('en-GB')} {formData.expiry_time}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 px-2">Free Add-ons</label>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.keys(formData.free_extras).map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            free_extras: {
                                                ...formData.free_extras,
                                                [key]: !formData.free_extras[key as keyof typeof formData.free_extras]
                                            }
                                        })}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.free_extras[key as keyof typeof formData.free_extras]
                                            ? 'bg-accent/10 border-accent/40 text-foreground'
                                            : 'bg-foreground/5 border-foreground/10 text-neutral-500'
                                            }`}
                                    >
                                        <span className="text-xs uppercase font-bold tracking-widest">{key}</span>
                                        {formData.free_extras[key as keyof typeof formData.free_extras] ? <Check size={14} /> : <Plus size={14} opacity={0.2} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 px-2">Visibility</label>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all w-full text-left ${formData.is_public
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                    : 'bg-neutral-500/10 border-neutral-500/30 text-neutral-500'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.is_public ? 'border-emerald-500' : 'border-neutral-500'}`}>
                                    {formData.is_public && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                </div>
                                <div>
                                    <span className="font-bold text-sm block">{formData.is_public ? 'Public Offer' : 'Private Offer'}</span>
                                    <span className="text-xs opacity-70">
                                        {formData.is_public ? 'Visible to AI and can be promoted in chat.' : 'Hidden from AI. Works only via direct link or typing code.'}
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mt-2">
                                <span className="shrink-0 mt-0.5">⚠</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-foreground text-background rounded-3xl font-bold flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all disabled:opacity-50 mt-4 shadow-2xl"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Publish Offer'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
