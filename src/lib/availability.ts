import { supabaseAdmin } from './supabase/admin';
import { getActiveCommissionCount, getWaitlistCommissionCount } from './commissions';

export interface AvailabilityData {
    is_accepting_commissions: boolean;
    status: 'open' | 'waitlist' | 'closed';
    last_updated: string;
    slots_remaining?: number;
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

    // Calculate Status based on current Supabase Workload
    const activeCount = await getActiveCommissionCount();
    const waitlistCount = await getWaitlistCommissionCount();

    // Limits:
    // Active (Accepted/In Progress/On Delivery) < 2: Open
    // Active >= 2 AND Waitlist < 2: Waitlist
    // Active >= 2 AND Waitlist >= 2: Closed

    let computedStatus: 'open' | 'waitlist' | 'closed' = 'open';
    let slotsRemaining = 0;
    const MAX_ACTIVE = 2;
    const MAX_WAITLIST = 2;

    if (activeCount < MAX_ACTIVE) {
        computedStatus = 'open';
        slotsRemaining = MAX_ACTIVE - activeCount;
    } else if (waitlistCount < MAX_WAITLIST) {
        computedStatus = 'waitlist';
        slotsRemaining = MAX_WAITLIST - waitlistCount;
    } else {
        computedStatus = 'closed';
        slotsRemaining = 0;
    }

    return {
        ...baseData,
        status: computedStatus,
        is_accepting_commissions: computedStatus !== 'closed',
        slots_remaining: slotsRemaining,
        max_slots: MAX_ACTIVE,
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
