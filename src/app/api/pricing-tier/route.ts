import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import {
    getCurrentPrices,
    getEarlyAccessProgress,
    isEarlyAccessActive,
    getCompletedCommissionCount
} from '@/lib/utils/pricing';

export async function GET() {
    try {
        const prices = await getCurrentPrices();
        const progress = await getEarlyAccessProgress();
        const isEarlyAccess = await isEarlyAccessActive();
        const commissionCount = await getCompletedCommissionCount();

        return NextResponse.json({
            isEarlyAccess,
            commissionCount,
            prices,
            progress,
        });
    } catch (error) {
        console.error('Pricing tier API error:', error);
        // Fail safe: return Early Access prices if error
        return NextResponse.json({
            isEarlyAccess: true,
            commissionCount: 0,
            prices: {
                A5: '₹499',
                A4: '₹999',
                A3: '₹1999',
            },
            progress: {
                current: 0,
                total: 10,
                remaining: 10,
            },
        });
    }
}

