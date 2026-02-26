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
    status: 'pending' | 'accepted' | 'in_progress' | 'on_delivery' | 'completed' | 'rejected' | 'waitlist';
    submitted_at: string;
    updated_at?: string;
    admin_note?: string;
    payout_status?: 'unpaid' | 'requested' | 'paid';
    needed_by?: string;
    // Commission Calculation Fields
    base_price?: number;
    extras_total?: number;
    commission_amount?: number;
    frame_image?: string;
}

// Get all commissions
export async function getAllCommissions(): Promise<CommissionData[]> {
    const { data, error } = await supabaseAdmin
        .from('commissions')
        .select('*')
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Error reading commissions from Supabase:', error);
        return [];
    }

    return (data || []) as CommissionData[];
}

// Save a new commission
export async function saveCommission(commission: CommissionData): Promise<void> {
    const { error } = await supabaseAdmin
        .from('commissions')
        .insert([commission]);

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
    status: 'pending' | 'accepted' | 'in_progress' | 'on_delivery' | 'completed' | 'rejected' | 'waitlist',
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

// Get count of ACTIVE workload
export async function getActiveWorkloadCount(): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('commissions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'accepted', 'in_progress', 'on_delivery', 'waitlist']);

    if (error) {
        console.error('Error counting active workload in Supabase:', error);
        return 0;
    }

    return count || 0;
}

// Get count of ACTIVE commissions (status === 'accepted', 'in_progress', 'on_delivery')
export async function getActiveCommissionCount(): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('commissions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['accepted', 'in_progress', 'on_delivery']);

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
        .in('status', ['pending', 'accepted', 'in_progress', 'on_delivery', 'waitlist']);

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
        .in('status', ['pending', 'accepted', 'in_progress', 'on_delivery', 'waitlist'])
        .maybeSingle();

    if (error) {
        console.error('Error getting active status from Supabase:', error);
        return null;
    }

    return data ? data.status : null;
}
