import { supabaseAdmin } from './supabase/admin';

export interface CommissionData {
    id: string;
    client_name: string;
    client_email: string;
    phone: string;
    instagram_id?: string;
    size: string;
    number_of_people: string;
    detailed_background?: boolean;
    timelapse_recording?: boolean;
    framing?: boolean;
    consent?: boolean;
    address: string;
    referral_code: string | null;
    referrer_info: {
        name?: string;
        email?: string;
        phone?: string;
        instagram?: string;
    } | null;
    status: 'pending' | 'accepted' | 'in_progress' | 'finished' | 'on_delivery' | 'completed' | 'rejected' | 'waitlist' | 'cancelled';
    submitted_at: string;
    updated_at?: string;
    admin_note?: string;
    payout_status?: 'unpaid' | 'requested' | 'paid';
    payout_details?: string;
    needed_by?: string;
    // Commission Calculation Fields
    base_price?: number;
    extras_total?: number;
    commission_amount?: number;
    frame_image?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_payment_link_id?: string;
    razorpay_payment_link_url?: string;
    payment_status?: 'pending' | 'reservation_paid' | 'deposit_paid' | 'fully_paid';
    payment_completed_at?: string;
    shipping_cost?: number;
    final_payment_link_id?: string;
    final_payment_link_url?: string;
    // Safety Flags
    is_self_referral_flag?: boolean;
    flag_reason?: string | null;
    // Promo/Offer Fields
    promo_id?: string | null;
    promotion_code?: string | null;
    discount_percent?: number | null;
    // WIP Gallery
    wip_images?: string[];
}

// Get all commissions
export async function getAllCommissions(): Promise<CommissionData[]> {
    const { data, error } = await supabaseAdmin
        .from('commissions')
        .select('*, offers(discount_percent)')
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Error reading commissions from Supabase:', error);
        return [];
    }

    // Flatten the joined offers data
    const enrichedData = (data || []).map((item: any) => {
        const { offers, ...rest } = item;
        return {
            ...rest,
            discount_percent: offers?.discount_percent || 0
        };
    });

    return enrichedData as CommissionData[];
}

// Save a new commission
export async function saveCommission(commission: CommissionData): Promise<void> {
    const { error } = await supabaseAdmin
        .from('commissions')
        .insert([{
            ...commission,
            payment_status: commission.payment_status || 'pending'
        }]);

    if (error) {
        console.error('Error saving commission to Supabase:', error);
        throw error;
    }
}

// Get commission by ID
export async function getCommissionById(id: string): Promise<CommissionData | null> {
    const { data, error } = await supabaseAdmin
        .from('commissions')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error getting commission from Supabase:', error);
        return null;
    }

    return data as CommissionData;
}

// Update commission status
export async function updateCommissionStatus(
    id: string,
    status: 'pending' | 'accepted' | 'in_progress' | 'finished' | 'on_delivery' | 'completed' | 'rejected' | 'waitlist' | 'cancelled',
    adminNote?: string
): Promise<CommissionData | null> {
    const updateData: {
        status: typeof status;
        updated_at: string;
        admin_note?: string;
    } = {
        status,
        updated_at: new Date().toISOString()
    };
    if (adminNote) updateData.admin_note = adminNote;

    const { data, error } = await supabaseAdmin
        .from('commissions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating commission status in Supabase:', error);
        return null;
    }

    return data as CommissionData;
}

// Generate unique commission ID
export function generateCommissionId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `COM_${timestamp}_${randomStr}`.toUpperCase();
}

// Delete a commission by ID
export async function deleteCommission(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('commissions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting commission from Supabase:', error);
        return false;
    }

    return true;
}

// Remove referral from a commission
export async function removeReferralFromCommission(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('commissions')
        .update({
            referral_code: null,
            referrer_info: null,
            commission_amount: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error('Error removing referral from commission in Supabase:', error);
        return false;
    }

    return true;
}

// Update commission payout status
export async function updateCommissionPayoutStatus(
    id: string,
    status: 'unpaid' | 'requested' | 'paid'
): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('commissions')
        .update({
            payout_status: status,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating payout status in Supabase:', error);
        return false;
    }

    return true;
}

// Update commission payment status manually
export async function updateCommissionPaymentStatus(
    id: string,
    status: 'pending' | 'reservation_paid' | 'deposit_paid' | 'fully_paid'
): Promise<CommissionData | null> {
    const updateData: Record<string, unknown> = {
        payment_status: status,
        updated_at: new Date().toISOString()
    };

    // If marking as paid (any stage), set the completion timestamp
    // This activates the 48-hour refund window correctly in the dashboard
    if (status !== 'pending') {
        updateData.payment_completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
        .from('commissions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating payment status in Supabase:', error);
        return null;
    }

    return data as CommissionData;
}

// Get count of accepted commissions for the current month
export async function getAcceptedCommissionCountForCurrentMonth(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count, error } = await supabaseAdmin
        .from('commissions')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', startOfMonth)
        .in('status', ['accepted', 'completed']);

    if (error) {
        console.error('Error counting monthly commissions in Supabase:', error);
        return 0;
    }

    return count || 0;
}

// Get count of ACTIVE workload (Review + Working + Waitlist)
export async function getActiveWorkloadCount(): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('commissions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'accepted', 'in_progress', 'finished', 'on_delivery', 'waitlist']);

    if (error) {
        console.error('Error counting active workload in Supabase:', error);
        return 0;
    }

    return count || 0;
}

// Get count of PENDING REVIEW commissions specifically
export async function getPendingReviewCount(): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('commissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    if (error) {
        console.error('Error counting pending review in Supabase:', error);
        return 0;
    }

    return count || 0;
}

// Promote the oldest waitlist person if a review slot is available
export async function promoteNextInWaitlist(): Promise<CommissionData | null> {
    const pendingCount = await getPendingReviewCount();

    if (pendingCount >= 2) return null;

    // Find the oldest waitlist commission
    const { data: nextUp, error: fetchError } = await supabaseAdmin
        .from('commissions')
        .select('*')
        .eq('status', 'waitlist')
        .order('submitted_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (fetchError || !nextUp) return null;

    // Promotion target depends on age (48h window)
    const submissionDate = new Date(nextUp.submitted_at);
    const now = new Date();
    const hoursElapsed = (now.getTime() - submissionDate.getTime()) / (1000 * 60 * 60);

    // If waitlisted person has been waiting > 48 hours, promote directly to accepted
    // Else promote to pending (Review Queue)
    const targetStatus = hoursElapsed > 48 ? 'accepted' : 'pending';

    return await updateCommissionStatus(nextUp.id, targetStatus);
}

// Get count of ACTIVE commissions (status === 'accepted', 'in_progress', 'on_delivery')
export async function getActiveCommissionCount(): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('commissions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['accepted', 'in_progress', 'finished', 'on_delivery']);

    if (error) {
        console.error('Error counting active commissions in Supabase:', error);
        return 0;
    }

    return count || 0;
}

// Get count of WAITLIST commissions
export async function getWaitlistCommissionCount(): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('commissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waitlist');

    if (error) {
        console.error('Error counting waitlist in Supabase:', error);
        return 0;
    }

    return count || 0;
}

// Check if a client email already has an active commission
export async function hasActiveCommission(email: string): Promise<boolean> {
    const emailLower = email.toLowerCase().trim();
    const { count, error } = await supabaseAdmin
        .from('commissions')
        .select('*', { count: 'exact', head: true })
        .eq('client_email', emailLower)
        .in('status', ['pending', 'accepted', 'in_progress', 'finished', 'on_delivery', 'waitlist']);

    if (error) {
        console.error('Error checking active commission in Supabase:', error);
        return false;
    }

    return (count || 0) > 0;
}

// Get the status of the active commission for an email
export async function getActiveCommissionStatus(email: string): Promise<string | null> {
    const emailLower = email.toLowerCase().trim();
    const { data, error } = await supabaseAdmin
        .from('commissions')
        .select('status')
        .eq('client_email', emailLower)
        .in('status', ['pending', 'accepted', 'in_progress', 'finished', 'on_delivery', 'waitlist'])
        .maybeSingle();

    if (error) {
        console.error('Error getting active status from Supabase:', error);
        return null;
    }

    return data ? data.status : null;
}
