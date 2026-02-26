import { supabaseAdmin } from './supabase/admin';
import crypto from 'crypto';

export interface ReferralData {
    code: string;
    referrer_email: string;
    referrer_name: string;
    referrer_phone?: string;
    referrer_instagram?: string;
    referrer_user_id?: string;
    created_at: string;
    ip_hash: string;
    successful_referrals_count: number;
    used_by_emails: string[];
    ip_submissions: Array<{ ip_hash: string; timestamp: string }>;
}

// Hash IP address for privacy
export function hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

// Normalize email for comparison (lowercase + trim)
export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

// Get all referrals
export async function getAllReferrals(): Promise<ReferralData[]> {
    const { data, error } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error reading referrals from Supabase:', error);
        return [];
    }

    return (data || []) as ReferralData[];
}

// Save a new referral
export async function saveReferral(referral: ReferralData): Promise<void> {
    const { error } = await supabaseAdmin
        .from('referrals')
        .insert([referral]);

    if (error) {
        console.error('Error saving referral to Supabase:', error);
        throw new Error('Failed to save referral');
    }
}

// Get referral by code
export async function getReferralByCode(code: string): Promise<ReferralData | null> {
    const { data, error } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('code', code)
        .maybeSingle();

    if (error) {
        console.error('Error getting referral by code from Supabase:', error);
        return null;
    }

    return data as ReferralData;
}

// Check if IP has exceeded rate limit
export async function hasIPExceededLimit(ipHash: string, referralCode: string): Promise<boolean> {
    const referral = await getReferralByCode(referralCode);
    if (!referral) return false;

    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    const recentSubmissions = (referral.ip_submissions || []).filter(sub => {
        const subTime = new Date(sub.timestamp).getTime();
        return sub.ip_hash === ipHash && subTime > twentyFourHoursAgo;
    });

    return recentSubmissions.length >= 2;
}

// Check if client email has already used this referral code
export async function hasClientUsedCode(clientEmail: string, code: string): Promise<boolean> {
    const referral = await getReferralByCode(code);
    if (!referral) return false;

    const normalizedClientEmail = normalizeEmail(clientEmail);
    return (referral.used_by_emails || []).some(email => normalizeEmail(email) === normalizedClientEmail);
}

// Increment successful referrals count, add client email, and track IP
export async function incrementReferralCount(code: string, clientEmail: string, ipHash: string): Promise<void> {
    const referral = await getReferralByCode(code);
    if (!referral) return;

    const normalizedClientEmail = normalizeEmail(clientEmail);
    const newCount = referral.successful_referrals_count < 3
        ? referral.successful_referrals_count + 1
        : referral.successful_referrals_count;

    const newUsedBy = [...(referral.used_by_emails || [])];
    if (!newUsedBy.includes(normalizedClientEmail)) {
        newUsedBy.push(normalizedClientEmail);
    }

    const newIpSubmissions = [...(referral.ip_submissions || []), {
        ip_hash: ipHash,
        timestamp: new Date().toISOString()
    }];

    const { error } = await supabaseAdmin
        .from('referrals')
        .update({
            successful_referrals_count: newCount,
            used_by_emails: newUsedBy,
            ip_submissions: newIpSubmissions
        })
        .eq('code', code);

    if (error) {
        console.error('Error incrementing referral count in Supabase:', error);
        throw new Error('Failed to update referral');
    }
}

// Check if referrer has reached commission cap
export async function hasReachedCommissionCap(code: string): Promise<boolean> {
    const referral = await getReferralByCode(code);
    if (!referral) return false;
    return referral.successful_referrals_count >= 3;
}

// Check if referral link has expired
export async function isReferralExpired(code: string): Promise<boolean> {
    const referral = await getReferralByCode(code);
    if (!referral) return false;
    return referral.successful_referrals_count >= 3;
}

// Get active (non-expired) referral for a user by email
export async function getActiveReferralForUser(email: string): Promise<ReferralData | null> {
    const normalizedEmail = normalizeEmail(email);

    const { data, error } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('referrer_email', normalizedEmail)
        .lt('successful_referrals_count', 3)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) {
        return null;
    }

    return data[0] as ReferralData;
}

// Validate that client is not using their own referral code
export async function validateNotSelfReferral(
    clientEmail: string,
    clientPhone: string | undefined,
    clientInstagram: string | undefined,
    referralCode: string,
    clientUserId?: string
): Promise<boolean> {
    const referral = await getReferralByCode(referralCode);

    if (!referral) {
        return true;
    }

    const normalizedClientEmail = normalizeEmail(clientEmail);
    const normalizedReferrerEmail = normalizeEmail(referral.referrer_email);
    if (normalizedClientEmail === normalizedReferrerEmail) {
        return false;
    }

    if (clientPhone && referral.referrer_phone) {
        const normalizedClientPhone = clientPhone.trim().replace(/\s+/g, '');
        const normalizedReferrerPhone = referral.referrer_phone.trim().replace(/\s+/g, '');
        if (normalizedClientPhone === normalizedReferrerPhone) {
            return false;
        }
    }

    if (clientInstagram && referral.referrer_instagram) {
        const normalizedClientInsta = clientInstagram.trim().toLowerCase().replace('@', '');
        const normalizedReferrerInsta = referral.referrer_instagram.trim().toLowerCase().replace('@', '');
        if (normalizedClientInsta === normalizedReferrerInsta) {
            return false;
        }
    }

    if (clientUserId && referral.referrer_user_id) {
        if (clientUserId === referral.referrer_user_id) {
            return false;
        }
    }

    return true;
}
