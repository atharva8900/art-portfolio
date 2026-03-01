import { DollarSign, CreditCard, Clock, Users } from 'lucide-react';

interface StatsProps {
    stats: {
        total_earnings: number;
        paid_earnings: number;
        available_for_payout: number;
        requested_payout: number;
        total_referrals: number;
    };
}

export default function StatsOverview({ stats }: StatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Earnings */}
            <div className="bg-surface border border-foreground/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-foreground/60 text-sm font-medium uppercase tracking-wider">Total Earnings</h3>
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <DollarSign size={20} />
                    </div>
                </div>
                <div className="text-3xl font-serif text-foreground">₹{stats.total_earnings}</div>
                <p className="text-foreground/50 text-xs mt-2 font-medium">Lifetime earnings</p>
            </div>

            {/* Unpaid Earnings */}
            <div className="bg-surface border border-foreground/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-foreground/60 text-sm font-medium uppercase tracking-wider">Unpaid Earnings</h3>
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <CreditCard size={20} />
                    </div>
                </div>
                <div className="text-3xl font-serif text-foreground">₹{stats.available_for_payout}</div>
                <p className="text-foreground/50 text-xs mt-2 font-medium">Eligible for Payout</p>
            </div>

            {/* Requested Payout */}
            <div className="bg-surface border border-foreground/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-foreground/60 text-sm font-medium uppercase tracking-wider">Processing</h3>
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <Clock size={20} />
                    </div>
                </div>
                <div className="text-3xl font-serif text-foreground">₹{stats.requested_payout}</div>
                <p className="text-foreground/50 text-xs mt-2 font-medium">Payout requested</p>
            </div>

            {/* Total Referrals */}
            <div className="bg-surface border border-foreground/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-foreground/60 text-sm font-medium uppercase tracking-wider">Successful Referrals</h3>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Users size={20} />
                    </div>
                </div>
                <div className="text-3xl font-serif text-foreground">{stats.total_referrals}</div>
                <p className="text-foreground/50 text-xs mt-2 font-medium">Completed commissions</p>
            </div>
        </div>
    );
}
