// Pricing Tiers
export const EARLY_ACCESS_PRICES = {
    A5: '₹499',
    A4: '₹999',
    A3: '₹1999',
};

export const REGULAR_PRICES = {
    A5: '₹750',
    A4: '₹1499',
    A3: '₹2999',
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
    
    // Round up the additional cost to maintain whole numbers and X99 format
    // Example: A4 (₹999) + 1 face (₹999 * 0.5 = 499.5) becomes 499.5 rounded up to 500. Total = 1499.
    const additionalCost = Math.ceil(basePrice * discountRate * additionalPeople);

    return basePrice + additionalCost;
}
