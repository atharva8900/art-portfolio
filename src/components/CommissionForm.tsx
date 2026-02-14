'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';

export default function CommissionForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [availability, setAvailability] = useState(true);

    // Check Availability
    useEffect(() => {
        fetch('/api/availability')
            .then(res => res.json())
            .then(data => setAvailability(data.is_accepting_commissions))
            .catch(() => setAvailability(false)); // Fail safe
    }, []);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        // Auto-attach referral code from localStorage
        const referralCode = localStorage.getItem('referrer_code');
        if (referralCode) {
            data.referral_code = referralCode;
        }

        try {
            const res = await fetch('/api/commissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                throw new Error('Failed to submit commission');
            }

            setSuccess(true);
            // Optional: clear referral code after successful use? 
            // User Logic: "One use per link". Backend handles "is_used". 
            // Frontend can keep it or clear it. Let's keep it safe.
        } catch {
            setError('Something went wrong. Please try again or DM on Instagram.');
        } finally {
            setLoading(false);
        }
    }

    if (!availability) {
        return (
            <section id="commission-form" className="py-24 px-6 md:px-12 bg-background flex flex-col items-center justify-center text-center">
                <h2 className="font-serif text-3xl text-neutral-500 uppercase tracking-widest mb-4">Commissions Closed</h2>
                <p className="text-neutral-400 max-w-md">I am currently fully booked. Please check back later or follow on Instagram for updates.</p>
            </section>
        );
    }

    if (success) {
        return (
            <section id="commission-form" className="py-24 px-6 md:px-12 bg-background flex flex-col items-center justify-center text-center min-h-[500px]">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-surface p-12 border border-white/10 rounded-sm"
                >
                    <CheckCircle className="w-16 h-16 text-accent mx-auto mb-6" />
                    <h2 className="font-serif text-3xl text-white uppercase tracking-widest mb-4">Request Sent</h2>
                    <p className="text-neutral-400 max-w-md">
                        Thank you for your interest. I will review your request and get back to you via email shortly to discuss the process and payment.
                    </p>
                </motion.div>
            </section>
        );
    }

    return (
        <section id="commission-form" className="py-24 px-6 md:px-12 bg-background">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="font-serif text-3xl md:text-5xl tracking-widest uppercase">Commission Request</h2>
                    <div className="h-[1px] w-24 bg-white/20 mx-auto mt-4" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-neutral-500">Full Name</label>
                            <input required name="name" type="text" className="w-full bg-surface border border-white/10 p-4 text-white focus:border-accent outline-none transition-colors" placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-neutral-500">Email Address</label>
                            <input required name="email" type="email" className="w-full bg-surface border border-white/10 p-4 text-white focus:border-accent outline-none transition-colors" placeholder="john@example.com" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-neutral-500">Phone (Optional)</label>
                            <input name="phone" type="tel" className="w-full bg-surface border border-white/10 p-4 text-white focus:border-accent outline-none transition-colors" placeholder="+91 ..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-neutral-500">Instagram ID (Optional)</label>
                            <input name="instagram_id" type="text" className="w-full bg-surface border border-white/10 p-4 text-white focus:border-accent outline-none transition-colors" placeholder="@username" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-neutral-500">Paper Size</label>
                            <select required name="size" className="w-full bg-surface border border-white/10 p-4 text-white focus:border-accent outline-none transition-colors appearance-none">
                                <option value="A5">A5 (₹500/person)</option>
                                <option value="A4">A4 (₹1000/person)</option>
                                <option value="A3">A3 (₹2000/person)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-neutral-500">Number of People</label>
                            <input required name="number_of_people" type="number" min="1" max="10" defaultValue="1" className="w-full bg-surface border border-white/10 p-4 text-white focus:border-accent outline-none transition-colors" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-neutral-500">Shipping Address</label>
                        <textarea required name="address" rows={3} className="w-full bg-surface border border-white/10 p-4 text-white focus:border-accent outline-none transition-colors" placeholder="Full address with pincode" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-neutral-500">Detailed Background Request (+₹500)</label>
                        <input name="background_detail" type="text" className="w-full bg-surface border border-white/10 p-4 text-white focus:border-accent outline-none transition-colors" placeholder="E.g. Scenery, pattern, or specific setting (Optional)" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-neutral-500">Additional Notes</label>
                        <textarea name="notes" rows={3} className="w-full bg-surface border border-white/10 p-4 text-white focus:border-accent outline-none transition-colors" placeholder="Any specific requests or deadline..." />
                    </div>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Submit Request'}
                    </button>
                </form>
            </div>
        </section>
    );
}
