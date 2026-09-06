import { supabaseAdmin } from '../supabase/admin';
import { getActiveWorkloadCount, getPendingReviewCount, getActiveCommissionCount } from '@/lib/db/commissions';
import { formatLocalDate } from '@/lib/utils/pricing-shared';

export interface AvailabilityData {
    is_accepting_commissions: boolean;
    status: 'open' | 'waitlist' | 'closed';
    last_updated: string;
    closure_reason?: string;
    reopen_date?: string;
    slots_remaining?: number;
    immediate_slots_remaining?: number;
    waitlist_slots_remaining?: number;
    max_slots?: number;
    // Sequential Queue & Cooldown Fields
    queue_start_date: string;
    booked_until_date: string | null;
    is_booked: boolean;
    cooldown_active: boolean;
    cooldown_reopen_date?: string | null;
}

// Default state used if database query fails or table is empty
const defaultData: AvailabilityData = {
    is_accepting_commissions: true,
    status: 'open',
    last_updated: new Date().toISOString(),
    queue_start_date: formatLocalDate(new Date()),
    booked_until_date: null,
    is_booked: false,
    cooldown_active: false,
    cooldown_reopen_date: null,
};

/**
 * Get current commission availability.
 * Combines admin toggle with dynamic workload, 3-day submission cooldown, and sequential queue timeline.
 */
export async function getAvailability(): Promise<AvailabilityData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Default queue start: 48 hours (2 days) after submission for review & preparation
    const defaultQueueStart = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    defaultQueueStart.setHours(0, 0, 0, 0);
    const defaultQueueStartStr = formatLocalDate(defaultQueueStart);

    const baseData: AvailabilityData = {
        ...defaultData,
        queue_start_date: defaultQueueStartStr,
    };

    let cooldownLiftedAt: string | null = null;

    try {
        const { data, error } = await supabaseAdmin
            .from('availability')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        if (error) throw error;
        if (data) {
            let isAccepting = data.is_accepting_commissions;
            cooldownLiftedAt = data.cooldown_lifted_at || null;
            
            // Auto-reopen logic: If a manual reopen date is set and has passed, override manual closure
            if (!isAccepting && data.reopen_date) {
                const reopenDate = new Date(data.reopen_date);
                if (reopenDate <= new Date()) {
                    isAccepting = true;
                }
            }

            baseData.is_accepting_commissions = isAccepting;
            baseData.closure_reason = data.closure_reason || undefined;
            baseData.reopen_date = data.reopen_date || undefined;
            baseData.last_updated = data.last_updated || new Date().toISOString();
        }
    } catch (error) {
        console.error('Error reading availability from Supabase:', error);
    }

    // 1. Calculate Sequential Queue & Booked Deadlines
    try {
        const { data: activeCommissions, error: commError } = await supabaseAdmin
            .from('commissions')
            .select('id, status, submitted_at, needed_by')
            .in('status', ['accepted', 'in_progress', 'redrawing', 'finished', 'on_delivery']);

        if (!commError && activeCommissions && activeCommissions.length > 0) {
            let latestDeadline: Date | null = null;

            for (const comm of activeCommissions) {
                let deadlineDate: Date;
                if (comm.needed_by) {
                    deadlineDate = new Date(comm.needed_by);
                } else {
                    // Default 21-day turnaround if needed_by was flexible
                    deadlineDate = new Date(new Date(comm.submitted_at || Date.now()).getTime() + 21 * 24 * 60 * 60 * 1000);
                }
                deadlineDate.setHours(0, 0, 0, 0);

                if (!latestDeadline || deadlineDate.getTime() > latestDeadline.getTime()) {
                    latestDeadline = deadlineDate;
                }
            }

            if (latestDeadline && latestDeadline.getTime() >= today.getTime()) {
                baseData.booked_until_date = formatLocalDate(latestDeadline);
                // Add 3-day buffer between projects
                const withBuffer = new Date(latestDeadline.getTime() + 3 * 24 * 60 * 60 * 1000);
                withBuffer.setHours(0, 0, 0, 0);
                baseData.queue_start_date = formatLocalDate(withBuffer);
                baseData.is_booked = true;
            }
        }
    } catch (queueErr) {
        console.error('Error calculating sequential queue in Supabase:', queueErr);
    }

    // 2. Calculate 3-Day Submission Cooldown for Active Slots
    // Checks if any pending commission exists for an active slot submitted within the last 72 hours
    let cooldownActive = false;
    let cooldownReopenDate: string | null = null;

    try {
        const { data: pendingReview, error: pendingErr } = await supabaseAdmin
            .from('commissions')
            .select('id, submitted_at')
            .eq('status', 'pending')
            .order('submitted_at', { ascending: false })
            .limit(1);

        if (!pendingErr && pendingReview && pendingReview.length > 0) {
            const latestPending = pendingReview[0];
            const submissionTime = new Date(latestPending.submitted_at).getTime();
            const cooldownExpiry = submissionTime + 3 * 24 * 60 * 60 * 1000;
            const now = Date.now();

            // Check if cooldown is still in effect and hasn't been manually lifted after this submission
            const isManuallyLifted = cooldownLiftedAt && new Date(cooldownLiftedAt).getTime() >= submissionTime;

            if (now < cooldownExpiry && !isManuallyLifted) {
                cooldownActive = true;
                cooldownReopenDate = new Date(cooldownExpiry).toISOString();
            }
        }
    } catch (cdErr) {
        console.error('Error checking cooldown in Supabase:', cdErr);
    }

    baseData.cooldown_active = cooldownActive;
    baseData.cooldown_reopen_date = cooldownReopenDate;

    // 3. Dynamic Logic Override
    // If Admin explicitly set it to Closed -> Stay Closed
    if (!baseData.is_accepting_commissions) {
        return {
            ...baseData,
            status: 'closed',
            slots_remaining: 0,
            max_slots: 2,
        };
    }

    // If 3-Day Cooldown is active -> Display Cooldown Closure
    if (cooldownActive) {
        return {
            ...baseData,
            status: 'closed',
            is_accepting_commissions: false,
            closure_reason: 'A new commission inquiry is currently under review.',
            reopen_date: cooldownReopenDate || undefined,
            slots_remaining: 0,
            immediate_slots_remaining: 0,
            waitlist_slots_remaining: 0,
            max_slots: 2,
        };
    }

    // 4. Calculate Standard Slots Status (Slots 1-2: Immediate, Slots 3-4: Waitlist)
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
        slots_remaining: totalSlotsRemaining,
        immediate_slots_remaining: immediateSlotsRemaining,
        waitlist_slots_remaining: waitlistSlotsRemaining,
        max_slots: MAX_TOTAL,
    };
}

/**
 * Set the admin commission toggle.
 */
export async function setAvailability(
    isOpen: boolean, 
    reason?: string, 
    reopenDate?: string
): Promise<AvailabilityData> {
    try {
        const newData = {
            is_accepting_commissions: isOpen,
            closure_reason: isOpen ? null : (reason || null),
            reopen_date: isOpen ? null : (reopenDate || null),
            last_updated: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
            .from('availability')
            .upsert({ id: 1, ...newData });

        if (error) throw error;

        return await getAvailability();
    } catch (error) {
        console.error('Error updating availability in Supabase:', error);
        throw new Error('Failed to update availability');
    }
}

/**
 * Manually lift the 3-day review cooldown.
 */
export async function liftCooldown(): Promise<AvailabilityData> {
    try {
        const { error } = await supabaseAdmin
            .from('availability')
            .upsert({ 
                id: 1, 
                cooldown_lifted_at: new Date().toISOString(),
                last_updated: new Date().toISOString()
            });

        if (error) {
            console.warn('Note: cooldown_lifted_at column might not exist yet, continuing gracefully:', error);
        }

        return await getAvailability();
    } catch (error) {
        console.error('Error lifting cooldown:', error);
        return await getAvailability();
    }
}

