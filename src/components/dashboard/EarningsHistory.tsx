'use client';

import { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';

interface HistoryItem {
    id: string;
    client_name: string;
    status: string;
    payout_status: 'unpaid' | 'requested' | 'paid';
    amount: number;
    date: string;
    code_used: string;
}

interface EarningsHistoryProps {
    history: HistoryItem[];
    onPayoutRequested: () => void; // Callback to refresh data
}

export default function EarningsHistory({ history, onPayoutRequested }: EarningsHistoryProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [paymentDetails, setPaymentDetails] = useState('');
    const [isRequesting, setIsRequesting] = useState<boolean | 'success'>(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);

    // Filter commissions eligible for payout
    const eligibleForPayout = history.filter(
        h => h.status === 'completed' && h.payout_status === 'unpaid' && h.amount > 0
    );

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === eligibleForPayout.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(eligibleForPayout.map(h => h.id));
        }
    };

    const handlePayoutRequest = async () => {
        if (!selectedIds.length) return;

        setIsRequesting(true);
        try {
            const res = await fetch('/api/user/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commissionIds: selectedIds,
                    paymentDetails
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to request payout');
            }

            // Success
            onPayoutRequested();
            setIsRequesting('success');
            setSelectedIds([]);
            setPaymentDetails('');

        } catch (error: unknown) {
            console.error('Payout Request Failed:', error);
            const err = error as { message?: string };
            alert(`Failed to submit payout request: ${err.message || 'Unknown error'}`);
            setIsRequesting(false);
        }
    };

    const getStatusBadge = (status: string, payoutStatus: string) => {
        if (status !== 'completed') {
            return <span className="px-2 py-1 rounded text-xs bg-surface hover:bg-surface\/80 text-neutral-400 capitalize">{status}</span>;
        }

        // If completed, show payout status
        switch (payoutStatus) {
            case 'paid':
                return <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">Paid</span>;
            case 'requested':
                return <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Processing</span>;
            default:
                return <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">Earned</span>;
        }
    };

    return (
        <div className="bg-surface border border-foreground/10 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-serif text-foreground">Earnings History</h2>

                {eligibleForPayout.length > 0 && (
                    <button
                        onClick={() => setShowPayoutModal(true)}
                        className="px-4 py-2 bg-accent text-background font-bold rounded hover:bg-foreground transition-colors flex items-center gap-2 text-sm"
                    >
                        Request Payout
                        <ArrowRight size={16} />
                    </button>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-foreground/10 text-neutral-400 text-sm">
                            <th className="py-4 px-4 font-normal">Date</th>
                            <th className="py-4 px-4 font-normal">Client</th>
                            <th className="py-4 px-4 font-normal">Referral Code</th>
                            <th className="py-4 px-4 font-normal">Amount</th>
                            <th className="py-4 px-4 font-normal">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-neutral-500">
                                    No commissions yet. Share your code to start earning!
                                </td>
                            </tr>
                        ) : (
                            history.map(item => (
                                <tr key={item.id} className="border-b border-foreground/5 hover:bg-foreground/5 transition-colors">
                                    <td className="py-4 px-4 text-neutral-300">
                                        {new Date(item.date).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="py-4 px-4 text-foreground font-medium">{item.client_name}</td>
                                    <td className="py-4 px-4 text-neutral-400 font-mono text-xs">{item.code_used}</td>
                                    <td className="py-4 px-4 text-accent">₹{item.amount}</td>
                                    <td className="py-4 px-4">
                                        {getStatusBadge(item.status, item.payout_status)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {history.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 text-sm">
                        No commissions yet.
                    </div>
                ) : (
                    history.map(item => (
                        <div key={item.id} className="bg-foreground/5 rounded-lg p-4 border border-foreground/5">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="text-foreground font-medium">{item.client_name}</div>
                                    <div className="text-neutral-500 text-xs">{new Date(item.date).toLocaleDateString('en-GB')}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-accent font-bold">₹{item.amount}</div>
                                    <div className="mt-1">{getStatusBadge(item.status, item.payout_status)}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-neutral-400 border-t border-foreground/5 pt-3 mt-1">
                                <span>Code: <span className="font-mono text-neutral-300">{item.code_used}</span></span>
                                {/* Payout Eligible Indicator for Mobile */}
                                {item.status === 'completed' && item.payout_status === 'unpaid' && item.amount > 0 && (
                                    <span className="text-accent flex items-center gap-1">
                                        Payout Available
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Payout Modal */}
            {showPayoutModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-foreground/10 rounded-xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">

                        {/* Success State */}
                        {isRequesting === 'success' ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                                    <CheckIcon size={32} />
                                </div>
                                <h3 className="text-2xl font-serif text-foreground mb-2">Payout Requested!</h3>
                                <p className="text-neutral-400 text-sm mb-6 max-w-xs mx-auto">
                                    Your request has been sent to the admin. You will receive an email confirmation shortly.
                                </p>
                                <button
                                    onClick={() => {
                                        setShowPayoutModal(false);
                                        setIsRequesting(false);
                                    }}
                                    className="px-8 py-3 bg-foreground text-background font-bold rounded hover:bg-neutral-200 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-serif text-foreground mb-4">Request Payout</h3>
                                <p className="text-neutral-400 text-sm mb-6">
                                    Select commissions you want to withdraw earnings for.
                                </p>

                                <div className="max-h-60 overflow-y-auto mb-6 border border-foreground/5 rounded bg-background/30">
                                    {eligibleForPayout.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleSelection(item.id)}
                                            className={`p-3 border-b border-foreground/5 flex items-center gap-3 cursor-pointer transition-colors ${selectedIds.includes(item.id) ? 'bg-accent/10' : 'hover:bg-foreground/5'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedIds.includes(item.id) ? 'bg-accent border-accent text-background' : 'border-neutral-600'}`}>
                                                {selectedIds.includes(item.id) && <CheckIcon size={14} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-foreground text-sm font-medium">{item.client_name}</div>
                                                <div className="text-neutral-500 text-xs">{new Date(item.date).toLocaleDateString('en-GB')}</div>
                                            </div>
                                            <div className="text-accent font-medium">₹{item.amount}</div>
                                        </div>
                                    ))}
                                </div>

                                {eligibleForPayout.length > 0 && (
                                    <div className="flex justify-between items-center mb-4 px-1">
                                        <button onClick={handleSelectAll} className="text-xs text-accent hover:underline">
                                            {selectedIds.length === eligibleForPayout.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                        <span className="text-sm text-neutral-300">
                                            Total: <span className="text-foreground font-bold ml-1">₹{eligibleForPayout.filter(i => selectedIds.includes(i.id)).reduce((sum, i) => sum + i.amount, 0)}</span>
                                        </span>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <label className="block text-neutral-400 text-xs uppercase tracking-wider mb-2">Payment Details (UPI ID / Bank Info)</label>
                                    <textarea
                                        value={paymentDetails}
                                        onChange={(e) => setPaymentDetails(e.target.value)}
                                        placeholder="e.g. 9876543210@upi or Bank Account Details..."
                                        className="w-full bg-background border border-foreground/10 rounded p-3 text-foreground text-sm focus:border-accent outline-none min-h-[80px]"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowPayoutModal(false)}
                                        className="flex-1 py-3 bg-surface hover:bg-surface\/80 hover:bg-neutral-700 text-foreground rounded font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePayoutRequest}
                                        disabled={!!isRequesting || selectedIds.length === 0 || !paymentDetails.trim()}
                                        className="flex-1 py-3 bg-accent hover:bg-foreground text-background rounded font-bold uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isRequesting === true ? <Loader2 className="animate-spin" size={20} /> : 'Submit Request'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function CheckIcon({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    )
}
