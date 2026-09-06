// Pricing Tiers
export const EARLY_ACCESS_PRICES = {
    A5: '₹499',
    A4: '₹999',
    A3: '₹1999',
    A2: '₹3999',
};

export const REGULAR_PRICES = {
    A5: '₹750',
    A4: '₹1499',
    A3: '₹2999',
    A2: '₹5999',
};

// Framing Prices based on size
export const FRAMING_PRICES: Record<'A5' | 'A4' | 'A3' | 'A2', number> = {
    A5: 400,
    A4: 500,
    A3: 600,
    A2: 800,
};

export const EARLY_ACCESS_LIMIT = 10;

// Type for pricing tier
export type PricingTier = 'early_access' | 'regular';

/**
 * Calculates the total price for a portrait based on size and number of people.
 * Formula:
 * - 1 Person: Base Price
 * - A4/A3/A2: Additional People cost +50% of Base Price each (group discount)
 * - A5: Additional People cost +100% of Base Price each (no discount)
 * @param basePrice The base price for the selected size (e.g., 500)
 * @param peopleCount The total number of people in the portrait (min 1)
 * @param size Optional paper size — A4/A3/A2 get group discount, A5 does not
 */
export function calculatePortraitPrice(basePrice: number, peopleCount: number, size?: 'A5' | 'A4' | 'A3' | 'A2'): number {
    if (peopleCount <= 1) return basePrice;

    const additionalPeople = peopleCount - 1;
    // A4/A3/A2 get 50% discount on extra people, A5 (or unspecified) charges full price
    const discountRate = (size === 'A4' || size === 'A3' || size === 'A2') ? 0.5 : 1.0;
    
    // Round up the additional cost to maintain whole numbers and X99 format
    // Example: A4 (₹999) + 1 face (₹999 * 0.5 = 499.5) becomes 499.5 rounded up to 500. Total = 1499.
    const additionalCost = Math.ceil(basePrice * discountRate * additionalPeople);

    return basePrice + additionalCost;
}

/**
 * Calculates the Detailed Background add-on price based on the paper size's base price (2x base price).
 */
export function calculateDetailedBackgroundPrice(basePrice: number): number {
    return basePrice * 2;
}

/**
 * Calculates the Detailed Clothes add-on price based on total portrait person price (1x portrait price).
 */
export function calculateDetailedClothesPrice(portraitPrice: number): number {
    return portraitPrice;
}

// Size-based minimum creation lead time (in days from queue start)
export const SIZE_MIN_LEAD_DAYS: Record<'A5' | 'A4' | 'A3' | 'A2', number> = {
    A5: 7,
    A4: 14,
    A3: 20,
    A2: 30,
};

// Size-based rush creation window (inclusive range in days from queue start)
export const SIZE_RUSH_WINDOWS: Record<'A5' | 'A4' | 'A3' | 'A2', { min: number; max: number } | null> = {
    A5: null, // No rush order available for A5
    A4: { min: 14, max: 20 },
    A3: { min: 20, max: 26 },
    A2: { min: 30, max: 36 },
};

export type CalendarDateCategory = 'past' | 'booked' | 'review' | 'disabled' | 'rush' | 'standard';

/**
 * Get the calendar status for a specific date given the queue start date and paper size.
 */
export function getDateCategory(
    targetDate: Date,
    queueStartDate: Date,
    size: 'A5' | 'A4' | 'A3' | 'A2',
    isBooked: boolean = false
): { category: CalendarDateCategory; isSelectable: boolean; isRush: boolean; tooltip: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const check = new Date(targetDate);
    check.setHours(0, 0, 0, 0);

    const queueStart = new Date(queueStartDate);
    queueStart.setHours(0, 0, 0, 0);

    // 1. Past dates
    if (check.getTime() < today.getTime()) {
        return {
            category: 'past',
            isSelectable: false,
            isRush: false,
            tooltip: 'Past date'
        };
    }

    // 2. Dates before Queue Start
    if (check.getTime() < queueStart.getTime()) {
        if (isBooked) {
            return {
                category: 'booked',
                isSelectable: false,
                isRush: false,
                tooltip: 'Artist is booked working on an active commission'
            };
        } else {
            return {
                category: 'review',
                isSelectable: false,
                isRush: false,
                tooltip: '48-hour inquiry review & material preparation'
            };
        }
    }

    // Diff days from queue start
    const diffTime = check.getTime() - queueStart.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const minLead = SIZE_MIN_LEAD_DAYS[size] || 14;
    const rushWindow = SIZE_RUSH_WINDOWS[size];

    // 3. Below minimum creation time
    if (diffDays < minLead) {
        return {
            category: 'disabled',
            isSelectable: false,
            isRush: false,
            tooltip: `Minimum creation time required (${minLead} days for ${size})`
        };
    }

    // 4. Rush order window
    if (rushWindow && diffDays >= rushWindow.min && diffDays <= rushWindow.max) {
        return {
            category: 'rush',
            isSelectable: true,
            isRush: true,
            tooltip: `Rush Order Window (${diffDays} days from queue start, +30% Rush Fee)`
        };
    }

    // 5. Standard available timeline
    return {
        category: 'standard',
        isSelectable: true,
        isRush: false,
        tooltip: `Standard Available Delivery (${diffDays} days from queue start, no rush fee)`
    };
}

// Timezone-safe local date formatting and parsing (YYYY-MM-DD)
export function formatLocalDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function parseLocalDate(str: string): Date {
    const [y, m, d] = str.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);
    return date;
}




