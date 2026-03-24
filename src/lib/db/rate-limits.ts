import { supabaseAdmin } from '../supabase/admin';

// ==========================================
// CHAT API RATE LIMITING (25/day per device)
// ==========================================
export async function checkAndUpdateChatLimit(fingerprintHash: string): Promise<{ allowed: boolean, count: number }> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const maxMessages = 25;

    // 1. Fetch current usage
    const { data, error } = await supabaseAdmin
        .from('chat_usage')
        .select('*')
        .eq('fingerprint_hash', fingerprintHash)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error('Error fetching chat_usage limit:', error);
        return { allowed: true, count: 0 }; // Fail open to not break chat for legitimate users on DB error
    }

    // 2. No record exists -> Create one
    if (!data) {
        await supabaseAdmin
            .from('chat_usage')
            .insert([{ fingerprint_hash: fingerprintHash, message_count: 1, last_reset_date: today }]);
        return { allowed: true, count: 1 };
    }

    // 3. Record exists
    let { message_count, last_reset_date } = data;

    // Is it a new day? Reset count.
    if (last_reset_date !== today) {
        message_count = 1;
        last_reset_date = today;
        await supabaseAdmin
            .from('chat_usage')
            .update({ message_count, last_reset_date })
            .eq('fingerprint_hash', fingerprintHash);
        return { allowed: true, count: 1 };
    }

    // Still the same day. Check limit.
    if (message_count >= maxMessages) {
        return { allowed: false, count: message_count };
    }

    // Increment count
    message_count += 1;
    await supabaseAdmin
        .from('chat_usage')
        .update({ message_count })
        .eq('fingerprint_hash', fingerprintHash);

    return { allowed: true, count: message_count };
}


// ==========================================
// OFFER VALIDATION RATE LIMITING (5/day per device)
// ==========================================
export async function checkAndUpdateOfferLimit(fingerprintHash: string): Promise<{ allowed: boolean, count: number }> {
    const today = new Date().toISOString().split('T')[0];
    const maxAttempts = 5;

    const { data, error } = await supabaseAdmin
        .from('offer_validations_usage')
        .select('*')
        .eq('fingerprint_hash', fingerprintHash)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching offer limit:', error);
        return { allowed: true, count: 0 };
    }

    if (!data) {
        await supabaseAdmin
            .from('offer_validations_usage')
            .insert([{ fingerprint_hash: fingerprintHash, validation_count: 1, last_reset_date: today }]);
        return { allowed: true, count: 1 };
    }

    let { validation_count, last_reset_date } = data;

    if (last_reset_date !== today) {
        validation_count = 1;
        last_reset_date = today;
        await supabaseAdmin
            .from('offer_validations_usage')
            .update({ validation_count, last_reset_date })
            .eq('fingerprint_hash', fingerprintHash);
        return { allowed: true, count: 1 };
    }

    if (validation_count >= maxAttempts) {
        return { allowed: false, count: validation_count };
    }

    validation_count += 1;
    await supabaseAdmin
        .from('offer_validations_usage')
        .update({ validation_count })
        .eq('fingerprint_hash', fingerprintHash);

    return { allowed: true, count: validation_count };
}


// ==========================================
// COMMISSION FORM MUTE/BAN SYSTEM
// ==========================================
export async function checkDeviceBanStatus(fingerprintHash: string, email?: string | null): Promise<{ isBlocked: boolean, reason?: string, type?: 'muted' | 'banned' }> {
    // 1. Check by Fingerprint
    const { data: fingerprintBan } = await supabaseAdmin
        .from('banned_devices')
        .select('*')
        .eq('fingerprint_hash', fingerprintHash)
        .maybeSingle();

    // 2. Check by Email (if provided)
    let emailBan = null;
    if (email) {
        const { data } = await supabaseAdmin
            .from('banned_devices')
            .select('*')
            .eq('user_email', email)
            .maybeSingle();
        emailBan = data;
    }

    // Combine results (prioritize stricter/active ban)
    const activeBan = fingerprintBan || emailBan;

    if (!activeBan) {
        return { isBlocked: false };
    }

    if (activeBan.status === 'banned') {
        return { isBlocked: true, reason: activeBan.reason || 'You have been permanently banned from submitting commissions.', type: 'banned' };
    }

    if (activeBan.status === 'muted') {
        const now = new Date();
        const expiresAt = new Date(activeBan.expires_at);
        if (now < expiresAt) {
            return { isBlocked: true, reason: activeBan.reason || 'You are temporarily muted from submitting commissions.', type: 'muted' };
        }
    }

    return { isBlocked: false };
}
