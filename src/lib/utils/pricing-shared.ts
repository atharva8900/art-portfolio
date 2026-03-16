// Pricing Tiers
export const EARLY_ACCESS_PRICES = {
    A5: '₹500',
    A4: '₹1000',
    A3: '₹2000',
};

export const REGULAR_PRICES = {
    A5: '₹750',
    A4: '₹1500',
    A3: '₹3000',
};

// Framing Prices based on size
export const FRAMING_PRICES: Record<'A5' | 'A4' | 'A3', number> = {
    A5: 200,
    A4: 300,
    A3: 400,
};

export const EARLY_ACCESS_LIMIT = 10;

// Type for pricing tier
export type PricingTier = 'early_access' | 'regular';

/**
 * Calculates the total price for a portrait based on size and number of people.
 * Formula:
 * - 1 Person: Base Price
 * - A4/A3: Additional People cost +50% of Base Price each (group discount)
 * - A5: Additional People cost +100% of Base Price each (no discount)
 * @param basePrice The base price for the selected size (e.g., 500)
 * @param peopleCount The total number of people in the portrait (min 1)
 * @param size Optional paper size — A4/A3 get group discount, A5 does not
 */
export function calculatePortraitPrice(basePrice: number, peopleCount: number, size?: 'A5' | 'A4' | 'A3'): number {
    if (peopleCount <= 1) return basePrice;

    const additionalPeople = peopleCount - 1;
    // A4/A3 get 50% discount on extra people, A5 (or unspecified) charges full price
    const discountRate = (size === 'A4' || size === 'A3') ? 0.5 : 1.0;
    const additionalCost = basePrice * discountRate * additionalPeople;

    return basePrice + additionalCost;
}
