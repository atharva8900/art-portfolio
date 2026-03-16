import { supabaseAdmin } from '../supabase/admin';
import { getActiveWorkloadCount, getPendingReviewCount, getActiveCommissionCount } from '@/lib/db/commissions';

export interface AvailabilityData {
    is_accepting_commissions: boolean;
    status: 'open' | 'waitlist' | 'closed';
    last_updated: string;
    slots_remaining?: number;
    immediate_slots_remaining?: number;
    waitlist_slots_remaining?: number;
    max_slots?: number;
}

// Default state used if database query fails or table is empty
const defaultData: AvailabilityData = {
    is_accepting_commissions: true,
    status: 'open',
    last_updated: new Date().toISOString(),
};

/**
 * Get current commission availability.
 * Combines admin toggle with dynamic workload calculation.
 */
export async function getAvailability(): Promise<AvailabilityData> {
    const baseData = { ...defaultData };

    try {
        const { data, error } = await supabaseAdmin
            .from('availability')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        if (error) throw error;
        if (data) {
            baseData.is_accepting_commissions = data.is_accepting_commissions;
            baseData.last_updated = data.last_updated || new Date().toISOString();
        }
    } catch (error) {
        console.error('Error reading availability from Supabase:', error);
    }

    // Dynamic Logic Override
    // If Admin explicitly set it to Closed -> Stay Closed regardless of workload
    if (!baseData.is_accepting_commissions) {
        return {
            ...baseData,
            status: 'closed',
            slots_remaining: 0,
            max_slots: 2,
        };
    }

    // Calculate Status based on:
    // Slots 1-2: Immediate (Accepted or Pending)
    // Slots 3-4: Waitlist
    // Total: 4

    // Parallelize workload queries to improve TTFB
    const [pendingReviewCount, activeCount, totalActive] = await Promise.all([
        getPendingReviewCount(),
        getActiveCommissionCount(),
        getActiveWorkloadCount()
    ]);

    const immediateOccupied = pendingReviewCount + activeCount;

    const MAX_TOTAL = 4;
    const MAX_IMMEDIATE = 2;

    let computedStatus: 'open' | 'waitlist' | 'closed' = 'open';

    if (totalActive >= MAX_TOTAL) {
        computedStatus = 'closed';
    } else if (immediateOccupied >= MAX_IMMEDIATE) {
        computedStatus = 'waitlist';
    } else {
        computedStatus = 'open';
    }

    const immediateSlotsRemaining = Math.max(0, MAX_IMMEDIATE - immediateOccupied);
    const totalSlotsRemaining = Math.max(0, MAX_TOTAL - totalActive);
    const waitlistSlotsRemaining = Math.max(0, totalSlotsRemaining - immediateSlotsRemaining);

    return {
        ...baseData,
        status: computedStatus,
        is_accepting_commissions: computedStatus !== 'closed',
        slots_remaining: totalSlotsRemaining, // Keep for backward compatibility
        immediate_slots_remaining: immediateSlotsRemaining,
        waitlist_slots_remaining: waitlistSlotsRemaining,
        max_slots: MAX_TOTAL,
    };
}

/**
 * Set the admin commission toggle.
 */
export async function setAvailability(isOpen: boolean): Promise<AvailabilityData> {
    try {
        const newData = {
            is_accepting_commissions: isOpen,
            last_updated: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
            .from('availability')
            .upsert({ id: 1, ...newData });

        if (error) throw error;

        // Return the fresh computed state
        return await getAvailability();
    } catch (error) {
        console.error('Error updating availability in Supabase:', error);
        throw new Error('Failed to update availability');
    }
}
