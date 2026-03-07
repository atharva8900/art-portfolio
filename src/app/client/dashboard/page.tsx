'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, ArrowLeft, ExternalLink, CalendarClock, Ban, Clock, CheckCircle, X, FileDown } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

// Mock CommissionData structure based on our schema
interface ClientCommission {
    id: string;
    client_name: string;
    client_email: string;
    size: string;
    extras: string[];
    base_price: number;
    extras_total: number;
    phone?: string;
    address?: string;
    number_of_people?: string;
    shipping_cost?: number;
    status: 'pending' | 'waitlist' | 'accepted' | 'in_progress' | 'finished' | 'on_delivery' | 'completed' | 'cancelled' | 'rejected';
    payment_status?: 'pending' | 'reservation_paid' | 'deposit_paid' | 'fully_paid';
    razorpay_order_id?: string;
    razorpay_payment_link_url?: string;
    final_payment_link_url?: string;
    payment_completed_at?: string;
    submitted_at: string;
    reference_images?: string[];
    wip_images?: string[];
}

export default function ClientDashboardPage() {
    const router = useRouter();
    const { status, data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [commissions, setCommissions] = useState<ClientCommission[]>([]);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const handleDownloadInvoice = async (commission: ClientCommission) => {
        // Dynamically import to avoid SSR issues with jspdf
        const { generateInvoice } = await import('@/lib/invoice');
        const extras = commission.extras || [];
        generateInvoice({
            id: commission.id,
            client_name: commission.client_name,
            client_email: commission.client_email,
            phone: commission.phone || '',
            address: commission.address || '',
            number_of_people: commission.number_of_people || '1',
            size: commission.size,
            extras_list: extras,
            detailed_background: extras.some(e => e.toLowerCase().includes('background')),
            timelapse_recording: extras.some(e => e.toLowerCase().includes('timelapse')),
            framing: extras.some(e => e.toLowerCase().includes('fram')),
            base_price: commission.base_price,
            extras_total: commission.extras_total,
            shipping_cost: commission.shipping_cost,
            status: commission.status,
            payment_status: commission.payment_status,
            payment_completed_at: commission.payment_completed_at,
            submitted_at: commission.submitted_at,
            referral_code: null,
            referrer_info: null,
        });
    };

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        } else if (status === 'authenticated') {
            fetchCommissions();
        }
    }, [status, router]);

    const fetchCommissions = async () => {
        try {
            const res = await fetch('/api/client/commissions');
            if (res.ok) {
                const data = await res.json();
                setCommissions(data.commissions || []);
            }
        } catch (error) {
            console.error('Failed to fetch client commissions', error);
        } finally {
            setLoading(false);
        }
    };

    const ACTIVE_STATUSES = ['pending', 'waitlist', 'accepted', 'in_progress', 'finished', 'on_delivery'];
    const HISTORY_STATUSES = ['completed', 'cancelled', 'rejected'];

    const activeCommissions = commissions.filter(c => ACTIVE_STATUSES.includes(c.status));
    const historyCommissions = commissions.filter(c => HISTORY_STATUSES.includes(c.status));

    const getStatusDisplay = (commission: ClientCommission) => {
        switch (commission.status) {
            case 'pending': return { text: 'Under Review', color: 'text-yellow-500 bg-yellow-500/10' };
            case 'waitlist':
                if (commission.payment_status === 'reservation_paid') return { text: 'Waitlist Reserved (25% Paid)', color: 'text-amber-500 bg-amber-500/10' };
                return { text: 'On Waitlist', color: 'text-orange-500 bg-orange-500/10' };
            case 'accepted':
                if (commission.payment_status === 'pending') return { text: 'Deposit Requested', color: 'text-blue-500 bg-blue-500/10' };
                return { text: 'Accepted', color: 'text-blue-500 bg-blue-500/10' };
            case 'in_progress':
                if (commission.payment_status === 'deposit_paid') {
                    if (commission.razorpay_order_id) return { text: 'Booked (Full 50% Paid)', color: 'text-emerald-500 bg-emerald-500/10' };
                    return { text: 'In Progress (Deposit Paid)', color: 'text-emerald-500 bg-emerald-500/10' };
                }
                return { text: 'In Progress', color: 'text-emerald-500 bg-emerald-500/10' };
            case 'finished':
                return { text: 'Artwork Ready', color: 'text-pink-500 bg-pink-500/10' };
            case 'on_delivery':
                return { text: 'Shipped', color: 'text-cyan-500 bg-cyan-500/10' };
            case 'completed': return { text: 'Artwork Delivered', color: 'text-purple-500 bg-purple-500/10' };
            case 'cancelled': return { text: 'Cancelled / Refunded', color: 'text-neutral-500 bg-neutral-500/10' };
            case 'rejected': return { text: 'Declined', color: 'text-red-500 bg-red-500/10' };
            default: return { text: 'Unknown', color: 'text-neutral-500 bg-neutral-500/10' };
        }
    };

    const isRefundable = (commission: ClientCommission) => {
        if (!commission.payment_completed_at) return false;

        // Exclude statuses that shouldn't be refunded (or are already refunded)
        if (['cancelled', 'rejected', 'completed', 'finished', 'on_delivery'].includes(commission.status)) {
            return false;
        }

        // Waitlist Reservation specific: Once full deposit (50%) is paid, it becomes non-refundable
        // (even if within 48h of the second payment)
        if (commission.razorpay_order_id && commission.payment_status === 'deposit_paid') {
            return false;
        }

        const paymentDate = new Date(commission.payment_completed_at);
        const now = new Date();
        const diffHours = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60);
        return diffHours <= 48;
    };

    const RequestRefundFallback = ({ commissionId }: { commissionId: string }) => {
        const [isRefunding, setIsRefunding] = useState(false);
        const [errorMsg, setErrorMsg] = useState('');
        const [showModal, setShowModal] = useState(false);

        const handleRefund = async () => {
            setIsRefunding(true);
            setErrorMsg('');
            try {
                const res = await fetch(`/api/client/commissions/${commissionId}/refund`, {
                    method: 'POST'
                });

                if (res.ok) {
                    await fetchCommissions(); // Refresh the list
                } else {
                    const data = await res.json();
                    setErrorMsg(data.error || 'Failed to process refund. Please contact support.');
                }
            } catch {
                setErrorMsg('Network error. Please try again.');
            } finally {
                setIsRefunding(false);
            }
        };

        return (
            <div className="mt-4 p-4 border border-red-500/20 bg-red-500/5 rounded-lg flex items-start gap-4">
                <Ban className="text-red-500 shrink-0 mt-1" size={20} />
                <div>
                    <h4 className="text-red-500 font-medium mb-1">Request a Refund</h4>
                    <p className="text-sm text-neutral-400 mb-3">You are within the 48-hour cancellation window since your deposit payment. You may cancel this commission and request a full refund to your original payment method.</p>
                    {errorMsg && <p className="text-red-400 text-sm mb-3 font-medium bg-red-500/10 p-2 rounded">{errorMsg}</p>}
                    <button
                        onClick={() => setShowModal(true)}
                        disabled={isRefunding}
                        className="inline-block px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium rounded-md transition-colors border border-red-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isRefunding && <Loader2 size={14} className="animate-spin" />}
                        {isRefunding ? 'Processing Refund...' : 'Cancel & Request Full Refund'}
                    </button>

                    <ConfirmationModal
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                        onConfirm={handleRefund}
                        title="Cancel Commission?"
                        message="Are you sure you want to cancel your commission and request a full refund? This action cannot be undone."
                        confirmText="Yes, Cancel & Refund"
                        cancelText="Keep Commission"
                        variant="danger"
                    />
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    return (
        <>
            <main className="min-h-screen bg-surface text-foreground">
                <Navbar />

                <div className="pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
                    <Link href="/" className="inline-flex items-center text-neutral-400 hover:text-foreground mb-8 transition-colors group">
                        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>

                    <div className="mb-10">
                        <h1 className="font-serif text-3xl md:text-5xl tracking-widest uppercase mb-4">
                            My Commissions
                        </h1>
                        <p className="text-neutral-500 max-w-lg mb-4">
                            Track the status of your artwork and manage payments.
                        </p>
                        {status === 'authenticated' && (
                            <p className="text-[10px] text-neutral-400 uppercase tracking-widest opacity-50">
                                Logged in as: {session?.user?.email}
                            </p>
                        )}
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 bg-foreground/5 border border-foreground/10 rounded-xl p-1 w-fit">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'active'
                                ? 'bg-foreground text-background shadow'
                                : 'text-neutral-400 hover:text-foreground'
                                }`}
                        >
                            <Clock size={15} />
                            Active
                            {activeCommissions.length > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab === 'active' ? 'bg-background/20 text-background' : 'bg-foreground/10 text-neutral-300'
                                    }`}>
                                    {activeCommissions.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'history'
                                ? 'bg-foreground text-background shadow'
                                : 'text-neutral-400 hover:text-foreground'
                                }`}
                        >
                            <CheckCircle size={15} />
                            History
                            {historyCommissions.length > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab === 'history' ? 'bg-background/20 text-background' : 'bg-foreground/10 text-foreground/50'
                                    }`}>
                                    {historyCommissions.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {activeTab === 'active' ? (
                        activeCommissions.length === 0 ? (
                            <div className="text-center py-20 border border-foreground/10 rounded-2xl bg-foreground/5">
                                <CalendarClock className="mx-auto text-neutral-500 mb-4" size={48} />
                                <h2 className="text-xl font-medium mb-2">No active commissions</h2>
                                <p className="text-neutral-400 mb-6">You haven&apos;t requested any custom artwork yet.</p>
                                <Link
                                    href="/#commission-form"
                                    className="inline-flex items-center px-6 py-3 bg-foreground text-background font-bold rounded-lg hover:opacity-90 transition-all uppercase tracking-wide text-sm"
                                >
                                    Request a Commission
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {activeCommissions.map((commission, idx) => {
                                    const statusDisplay = getStatusDisplay(commission);
                                    const total = (commission.base_price || 0) + (commission.extras_total || 0);
                                    const deposit = Math.ceil(total / 2);
                                    const alreadyPaid = Math.round(total * 0.25);
                                    const remainingDeposit = deposit - alreadyPaid;

                                    return (
                                        <motion.div
                                            key={commission.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="border border-foreground/10 rounded-2xl p-6 bg-foreground/5 flex flex-col md:flex-row gap-8"
                                        >
                                            {/* Left Details */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border border-current ${statusDisplay.color}`}>
                                                        {statusDisplay.text}
                                                    </span>
                                                    <span className="text-sm text-neutral-500">
                                                        ID: {commission.id.slice(0, 8).toUpperCase()}
                                                    </span>
                                                </div>

                                                <h3 className="text-xl font-medium text-foreground mb-4">
                                                    {commission.size} Artwork
                                                </h3>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between border-b border-foreground/5 pb-2">
                                                        <span className="text-neutral-400">Requested On</span>
                                                        <span className="text-foreground">{new Date(commission.submitted_at).toLocaleDateString('en-GB')}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-foreground/5 pb-2">
                                                        <span className="text-neutral-400">Add-ons</span>
                                                        <span className="text-foreground text-right">
                                                            {commission.extras && commission.extras.length > 0 ? commission.extras.join(', ') : 'None'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between pt-2 font-medium">
                                                        <span className="text-neutral-400">Total Price</span>
                                                        <span className="text-foreground font-mono">₹{total}</span>
                                                    </div>
                                                </div>

                                                {/* WIP Gallery — only shown when in progress or later */}
                                                {(['in_progress', 'finished', 'on_delivery', 'completed'] as ClientCommission['status'][]).includes(commission.status) && commission.wip_images && commission.wip_images.length > 0 && (
                                                    <div className="mt-5 pt-5 border-t border-foreground/10">
                                                        <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase mb-3">Artwork Progress</p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {(['Outlines', 'Mid-process', 'Finished artwork'] as const).map((label, i) => {
                                                                const imgUrl = commission.wip_images?.[i] ?? null;
                                                                return (
                                                                    <div key={label} className="flex flex-col gap-1.5">
                                                                        <div className={`aspect-square rounded-lg overflow-hidden border transition-all ${imgUrl ? 'border-foreground/20 cursor-zoom-in hover:border-accent/40' : 'border-foreground/10 border-dashed'} bg-foreground/5`}>
                                                                            {imgUrl ? (
                                                                                <div className="relative group w-full h-full">
                                                                                    <img
                                                                                        src={imgUrl}
                                                                                        alt={`WIP ${label}`}
                                                                                        className="w-full h-full object-cover"
                                                                                        onClick={() => setLightboxUrl(imgUrl)}
                                                                                    />
                                                                                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                                                                                        <button
                                                                                            onClick={() => setLightboxUrl(imgUrl)}
                                                                                            className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                                                                                            title="View full size"
                                                                                        >
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg>
                                                                                        </button>
                                                                                        <a
                                                                                            href={imgUrl}
                                                                                            download={`${label.replace(/\s+/g, '-')}-${commission.id.slice(0, 6)}.jpg`}
                                                                                            onClick={e => e.stopPropagation()}
                                                                                            className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                                                                                            title="Download"
                                                                                        >
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 0 0 1-2 2H5a2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                                                                        </a>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center">
                                                                                    <div className="w-5 h-5 rounded-full border-2 border-dashed border-foreground/15" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <p className={`text-[10px] text-center font-medium ${imgUrl ? 'text-neutral-400' : 'text-neutral-600'}`}>{label}</p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Actions */}
                                            <div className="md:w-72 flex flex-col justify-center border-t md:border-t-0 md:border-l border-foreground/10 pt-6 md:pt-0 md:pl-8">
                                                {commission.payment_status === 'fully_paid' ? (
                                                    <div className="text-center">
                                                        <CheckCircle className="mx-auto text-emerald-500 mb-2" size={32} />
                                                        <p className="text-sm font-medium text-emerald-400">Full Payment Received</p>
                                                        {commission.status === 'on_delivery' || commission.status === 'completed' ? (
                                                            <p className="text-xs text-neutral-400 mt-2">I&apos;ve received your final payment! Your artwork has been shipped.</p>
                                                        ) : (
                                                            <p className="text-xs text-neutral-400 mt-2">I&apos;ve received your final payment! Preparing your artwork for shipment now.</p>
                                                        )}
                                                    </div>
                                                ) : commission.status === 'accepted' && commission.payment_status === 'pending' && commission.razorpay_payment_link_url ? (
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-blue-400 mb-2">Deposit Required to Begin</p>
                                                        <p className="text-2xl font-serif text-foreground mb-4">₹{deposit}</p>
                                                        <a
                                                            href={commission.razorpay_payment_link_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-accent hover:bg-accent/90 text-background font-bold rounded-lg transition-colors"
                                                        >
                                                            Pay 50% Deposit <ExternalLink size={18} />
                                                        </a>
                                                        <p className="text-xs text-neutral-500 mt-3 border-t border-neutral-800 pt-3">
                                                            Securely processed via Razorpay. Your slot is reserved but work will not begin until the deposit is received.
                                                        </p>
                                                    </div>
                                                ) : commission.status === 'accepted' && commission.payment_status === 'reservation_paid' && commission.razorpay_payment_link_url ? (
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-amber-500 mb-2">Waitlist Slot Accepted!</p>
                                                        <p className="text-2xl font-serif text-foreground mb-4">₹{remainingDeposit}</p>
                                                        <a
                                                            href={commission.razorpay_payment_link_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-amber-500/20"
                                                        >
                                                            Pay Remaining 25% <ExternalLink size={18} />
                                                        </a>
                                                        <p className="text-xs text-neutral-500 mt-3 border-t border-neutral-800 pt-3">
                                                            Your waitlist slot is ready! Please pay the remaining 25% deposit to officially begin the work.
                                                        </p>
                                                    </div>
                                                ) : commission.status === 'finished' ? (
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-pink-400 mb-2">Final Balance Due</p>
                                                        <div className="space-y-1 mb-4">
                                                            <div className="flex justify-between text-xs text-neutral-400">
                                                                <span>Remaining 50%</span>
                                                                <span>₹{total - deposit}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs text-neutral-400">
                                                                <span>Shipping (DTDC)</span>
                                                                <span>₹{commission.shipping_cost || 0}</span>
                                                            </div>
                                                            <div className="flex justify-between text-lg font-serif text-foreground border-t border-foreground/10 pt-1 mt-1">
                                                                <span>Total Due</span>
                                                                <span>₹{(total - deposit) + (commission.shipping_cost || 0)}</span>
                                                            </div>
                                                        </div>
                                                        {commission.final_payment_link_url ? (
                                                            <a
                                                                href={commission.final_payment_link_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-pink-500/20"
                                                            >
                                                                Pay Final Balance <ExternalLink size={18} />
                                                            </a>
                                                        ) : (
                                                            <p className="text-xs text-neutral-500 italic">
                                                                I am calculating the final shipping costs and preparing your invoice. You&apos;ll receive a link to pay the balance shortly.
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-neutral-500 mt-3 border-t border-neutral-800 pt-3">
                                                            Artwork will be shipped immediately upon receipt of final payment.
                                                        </p>
                                                    </div>
                                                ) : isRefundable(commission) ? (
                                                    <div className="flex flex-col h-full justify-center">
                                                        <p className="text-sm text-emerald-400 mb-2 font-medium">Payment Received</p>
                                                        <p className="text-xs text-neutral-400 mb-4">I have received your deposit and work has officially begun!</p>
                                                        <RequestRefundFallback commissionId={commission.id} />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                                        {commission.status === 'pending' || commission.status === 'waitlist' ? (
                                                            <p className="text-neutral-400 text-sm">
                                                                I am reviewing your request. You will be notified via email when your slot is accepted and a deposit is requested.
                                                            </p>
                                                        ) : commission.status === 'accepted' && (commission.payment_status === 'pending' || commission.payment_status === 'reservation_paid') && !commission.razorpay_payment_link_url ? (
                                                            <div className="space-y-2">
                                                                <p className="text-blue-400 font-medium pb-2 border-b border-foreground/5">
                                                                    Custom Artwork Accepted!
                                                                </p>
                                                                <p className="text-neutral-400 text-sm">
                                                                    Your {commission.payment_status === 'reservation_paid' ? 'remaining ' : '50% '}deposit payment link is being prepared. Check back shortly.
                                                                </p>
                                                            </div>
                                                        ) : commission.status === 'completed' || commission.status === 'on_delivery' ? (
                                                            <div className="space-y-2">
                                                                <p className="text-emerald-500 font-medium pb-2 border-b border-foreground/5">
                                                                    {commission.status === 'on_delivery' ? 'Artwork Shipped!' : 'Artwork Completed!'}
                                                                </p>
                                                                <p className="text-neutral-400 text-sm">
                                                                    {commission.status === 'on_delivery'
                                                                        ? "Your artwork is on its way! Please let me know once it reaches you!"
                                                                        : 'This commission is now archived. Hope you love your new artwork!'}
                                                                </p>
                                                            </div>
                                                        ) : commission.status === 'cancelled' ? (
                                                            <p className="text-neutral-500 font-medium">
                                                                This commission is cancelled.
                                                            </p>
                                                        ) : commission.status === 'rejected' ? (
                                                            <p className="text-red-500 font-medium pb-2 border-b border-foreground/5">
                                                                Unfortunately, I could not take on this commission right now. I hope we can work together in the future!
                                                            </p>
                                                        ) : (
                                                            <p className="text-neutral-400 text-sm">
                                                                The 48-hour return window has expired. Work is in progress!
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Invoice Download — shown when any payment is made (reservation_paid, deposit_paid, fully_paid) */}
                                                {(commission.payment_status && commission.payment_status !== 'pending') && (
                                                    <button
                                                        onClick={() => handleDownloadInvoice(commission)}
                                                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-foreground/15 hover:border-foreground/30 text-neutral-400 hover:text-foreground text-sm rounded-lg transition-all"
                                                    >
                                                        <FileDown size={16} />
                                                        Download Invoice
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        historyCommissions.length === 0 ? (
                            <div className="text-center py-20 border border-foreground/10 rounded-2xl bg-foreground/5">
                                <CheckCircle className="mx-auto text-neutral-500 mb-4" size={48} />
                                <h2 className="text-xl font-medium mb-2">No commission history</h2>
                                <p className="text-neutral-400">Completed, cancelled, and declined commissions will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {historyCommissions.map((commission, idx) => {
                                    const statusDisplay = getStatusDisplay(commission);
                                    const total = (commission.base_price || 0) + (commission.extras_total || 0);
                                    return (
                                        <motion.div
                                            key={commission.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="border border-foreground/10 rounded-2xl p-6 bg-foreground/5 opacity-75 hover:opacity-100 transition-opacity flex flex-col md:flex-row gap-8"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border border-current ${statusDisplay.color}`}>
                                                        {statusDisplay.text}
                                                    </span>
                                                    <span className="text-sm text-neutral-500">ID: {commission.id.slice(0, 8).toUpperCase()}</span>
                                                </div>
                                                <h3 className="text-xl font-medium text-foreground mb-4">{commission.size} Artwork</h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between border-b border-foreground/5 pb-2">
                                                        <span className="text-neutral-400">Requested On</span>
                                                        <span className="text-foreground">{new Date(commission.submitted_at).toLocaleDateString('en-GB')}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-foreground/5 pb-2">
                                                        <span className="text-neutral-400">Add-ons</span>
                                                        <span className="text-foreground text-right">
                                                            {commission.extras && commission.extras.length > 0 ? commission.extras.join(', ') : 'None'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between pt-2 font-medium">
                                                        <span className="text-neutral-400">Total Price</span>
                                                        <span className="text-foreground font-mono">₹{total}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:w-72 flex flex-col justify-center border-t md:border-t-0 md:border-l border-foreground/10 pt-6 md:pt-0 md:pl-8">
                                                <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                                                    {commission.status === 'completed' && (
                                                        <>
                                                            <CheckCircle className="text-purple-500" size={32} />
                                                            <p className="text-purple-400 font-medium">Artwork Delivered</p>
                                                            <p className="text-neutral-500 text-sm">Hope you love your new artwork!</p>
                                                            <button
                                                                onClick={() => handleDownloadInvoice(commission)}
                                                                className="mt-2 flex items-center gap-2 py-2 px-4 border border-foreground/15 hover:border-foreground/30 text-neutral-400 hover:text-foreground text-sm rounded-lg transition-all"
                                                            >
                                                                <FileDown size={15} />
                                                                Download Invoice
                                                            </button>
                                                        </>
                                                    )}
                                                    {commission.status === 'cancelled' && (
                                                        <>
                                                            <Ban className="text-neutral-500" size={32} />
                                                            <p className="text-neutral-400 font-medium">Commission Cancelled</p>
                                                            <p className="text-neutral-500 text-sm">Your refund has been initiated. This typically takes 5–7 business days.</p>
                                                        </>
                                                    )}
                                                    {commission.status === 'rejected' && (
                                                        <>
                                                            <Ban className="text-red-500/60" size={32} />
                                                            <p className="text-red-400/80 font-medium">Commission Declined</p>
                                                            <p className="text-neutral-500 text-sm">Unfortunately I could not take on this commission. I hope we can work together in the future!</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>

                <Footer />
            </main>

            {/* Lightbox */}
            {
                lightboxUrl && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                        onClick={() => setLightboxUrl(null)}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={() => setLightboxUrl(null)}
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={lightboxUrl}
                            alt="WIP"
                            className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                )
            }
        </>
    );
}
