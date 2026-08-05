import { getAllCommissions } from '@/lib/db/commissions';
import {
    EARLY_ACCESS_PRICES,
    REGULAR_PRICES,
    EARLY_ACCESS_LIMIT,
    PricingTier
} from '@/lib/utils/pricing-shared';

// Re-export shared types and constants for server-side convenience
export * from '@/lib/utils/pricing-shared';

// Get count of completed commissions
export async function getCompletedCommissionCount(): Promise<number> {
    const commissions = await getAllCommissions();
    return commissions.filter(c => c.status === 'completed').length;
}

// Determine current pricing tier based on completed commissions
export async function getCurrentPricingTier(): Promise<PricingTier> {
    const completedCount = await getCompletedCommissionCount();
    return completedCount < EARLY_ACCESS_LIMIT ? 'early_access' : 'regular';
}

// Get prices based on current tier
export async function getCurrentPrices(): Promise<typeof EARLY_ACCESS_PRICES> {
    const tier = await getCurrentPricingTier();
    return tier === 'early_access' ? EARLY_ACCESS_PRICES : REGULAR_PRICES;
}

// Get price for a specific size
export async function getPriceForSize(size: 'A5' | 'A4' | 'A3' | 'A2'): Promise<string> {
    const prices = await getCurrentPrices();
    return prices[size];
}

// Get Early Access progress data
export async function getEarlyAccessProgress(): Promise<{ current: number; total: number; remaining: number }> {
    const current = await getCompletedCommissionCount();
    return {
        current,
        total: EARLY_ACCESS_LIMIT,
        remaining: Math.max(0, EARLY_ACCESS_LIMIT - current),
    };
}


// Check if Early Access is still active
export async function isEarlyAccessActive(): Promise<boolean> {
    const tier = await getCurrentPricingTier();
    return tier === 'early_access';
}
