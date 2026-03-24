import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/api/email';

/**
 * Performs the full expiry cleanup for an expired mute:
 * - Deletes the ban record
 * - Moves muted/banned commissions to 'rejected' (History tab)
 * - Sends "Restriction Lifted" email to the user
 *
 * This runs when the USER themselves visits the site after expiry,
 * so the cleanup happens in real-time without waiting for admin to open dashboard.
 */
async function performExpiryCleanup(data: { fingerprint_hash: string; user_email?: string | null }) {
    const { fingerprint_hash, user_email } = data;

    // 1. Delete ban record
    await supabaseAdmin
        .from('banned_devices')
        .delete()
        .eq('fingerprint_hash', fingerprint_hash);

    // 2. Move muted commissions to 'rejected' (shows in History tab)
    const orFilter = user_email
        ? `fingerprint_hash.eq.${fingerprint_hash},submitter_email.eq.${user_email},client_email.eq.${user_email}`
        : `fingerprint_hash.eq.${fingerprint_hash}`;

    const { data: updatedComms } = await supabaseAdmin
        .from('commissions')
        .update({ status: 'rejected' })
        .or(orFilter)
        .in('status', ['muted', 'banned'])
        .select('client_email, client_name');

    // 3. Send "Restriction Lifted" email
    const targetEmail = user_email || (updatedComms && updatedComms.length > 0 ? updatedComms[0].client_email : null);

    if (targetEmail) {
        await sendEmail({
            to: targetEmail,
            subject: `Account Restriction Lifted – Atharva Sherlekar Art`,
            html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.5;">
                    <h1>Restriction Lifted</h1>
                    <p>Hello,</p>
                    <p>Your temporary mute has expired and the restriction on your account/device has been <strong>automatically lifted</strong>.</p>
                    
                    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 20px 0;">
                        <p style="margin: 0; color: #166534;"><strong>Your access has been fully restored.</strong></p>
                    </div>

                    <p>You are now free to submit new commission requests. Thank you for your patience.</p>
                    <p>If you have any questions, feel free to reach out via <strong>Direct Message on Instagram (@atharva_sherlekar_art)</strong>.</p>
                    
                    <br />
                    <p>Regards,</p>
                    <p><strong>Atharva Sherlekar Art</strong></p>
                </div>
            `
        }).catch(() => { /* Non-fatal: email failure shouldn't block the user */ });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fingerprint_hash, user_email } = body;

        if (!fingerprint_hash && !user_email) {
            return NextResponse.json({ restricted: false });
        }

        // Build query: match fingerprint OR email
        let query = supabaseAdmin.from('banned_devices').select('*');

        if (fingerprint_hash && user_email) {
            query = query.or(`fingerprint_hash.eq.${fingerprint_hash},user_email.eq.${user_email}`);
        } else if (fingerprint_hash) {
            query = query.eq('fingerprint_hash', fingerprint_hash);
        } else if (user_email) {
            query = query.eq('user_email', user_email);
        }

        const { data, error } = await query.maybeSingle();

        if (error || !data) {
            return NextResponse.json({ restricted: false });
        }

        // Check if mute has expired → trigger full cleanup on user's visit
        if (data.status === 'muted' && data.expires_at) {
            const isExpired = new Date(data.expires_at) < new Date();
            if (isExpired) {
                // Fire-and-forget: don't await so the user isn't blocked
                performExpiryCleanup({
                    fingerprint_hash: data.fingerprint_hash,
                    user_email: data.user_email ?? user_email ?? null
                }).catch(err => console.error('Expiry cleanup failed:', err));

                return NextResponse.json({ restricted: false });
            }
        }

        return NextResponse.json({
            restricted: true,
            status: data.status, // 'muted' | 'banned'
            expires_at: data.expires_at,
            reason: data.reason,
        });
    } catch {
        // Fail open — don't block users on unexpected errors
        return NextResponse.json({ restricted: false });
    }
}
