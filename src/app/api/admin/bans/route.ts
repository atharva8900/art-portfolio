import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkAdminAuth } from '@/lib/auth/admin-auth';
import { sendEmail } from '@/lib/api/email';

export async function GET() {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('banned_devices')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ bans: data || [] });
    } catch (error) {
        console.error('Error fetching bans:', error);
        return NextResponse.json({ error: 'Failed to fetch bans' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { fingerprint_hash, user_email, status, reason, duration_ms, commission_id } = body;

        if ((!fingerprint_hash && !user_email) || !status || !['muted', 'banned'].includes(status)) {
            return NextResponse.json({ error: 'Invalid payload. Provide fingerprint or email.' }, { status: 400 });
        }

        let expires_at = null;
        if (status === 'muted' && duration_ms) {
            expires_at = new Date(Date.now() + duration_ms).toISOString();
        }

        // 1. Upsert the ban
        const { error: banError } = await supabaseAdmin
            .from('banned_devices')
            .upsert({
                fingerprint_hash: fingerprint_hash || `EMAIL_BAN_${user_email}`,
                user_email: user_email || null,
                status,
                reason: reason || null,
                expires_at,
                updated_at: new Date().toISOString()
            });

        if (banError) throw banError;

        // 2. Update commission status if ID provided
        if (commission_id) {
            await supabaseAdmin
                .from('commissions')
                .update({ status })
                .eq('id', commission_id);
        }

        // 3. Send Email Notification
        if (user_email) {
            const isPermanent = status === 'banned';
            let durationText = 'permanently';
            
            if (!isPermanent && duration_ms) {
                const hours = Math.round(duration_ms / 3600000);
                if (hours < 48) {
                    durationText = `temporarily for ${hours} hours`;
                } else if (hours < 24 * 7) {
                    durationText = `temporarily for ${Math.round(hours / 24)} days`;
                } else if (hours < 24 * 30) {
                    durationText = `temporarily for ${Math.round(hours / (24 * 7))} week(s)`;
                } else {
                    durationText = `temporarily for ${Math.round(hours / (24 * 30))} month(s)`;
                }
            }
            
            await sendEmail({
                to: user_email,
                subject: `Account Restriction – Atharva Sherlekar Art`,
                html: `
                    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.5;">
                        <h1>Account Restriction Notice</h1>
                        <p>Hello,</p>
                        <p>This is to inform you that your device and account have been <strong>${status}</strong> ${durationText} from submitting new commission requests on our platform.</p>
                        
                        <div style="background-color: #fff1f2; padding: 20px; border-radius: 8px; border: 1px solid #fecdd3; margin: 20px 0;">
                            <p style="margin-top: 0; font-weight: bold; color: #991b1b;">Reason for restriction:</p>
                            <p style="margin-bottom: 0;"><strong>False form submission</strong></p>
                        </div>

                        ${expires_at ? `<p>This restriction is expected to expire on: <strong>${new Date(expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></p>` : ''}
                        
                        <p>If you believe this was a mistake or wish to appeal this decision, please reach out to us by sending a <strong>Direct Message (DM) to @atharva_sherlekar_art on Instagram</strong>.</p>
                        
                        <br />
                        <p>Regards,</p>
                        <p><strong>Atharva Sherlekar Art</strong></p>
                    </div>
                `
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding ban:', error);
        return NextResponse.json({ error: 'Failed to add ban' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const hash = searchParams.get('hash');
        const email = searchParams.get('email');
        const commissionId = searchParams.get('commissionId');

        if (!hash && !email && !commissionId) {
            return NextResponse.json({ error: 'Identification required' }, { status: 400 });
        }

        // 1. Get the ban record first to get the email if not provided
        let targetEmail = email;
        let banRecord = null;
        
        if (hash) {
            const { data } = await supabaseAdmin
                .from('banned_devices')
                .select('user_email, status')
                .eq('fingerprint_hash', hash)
                .maybeSingle();
            banRecord = data;
            if (banRecord?.user_email && !targetEmail) {
                targetEmail = banRecord.user_email;
            }
        }

        // 2. Delete the ban record if hash provided
        if (hash) {
            await supabaseAdmin
                .from('banned_devices')
                .delete()
                .eq('fingerprint_hash', hash);
        }

        // 3. Update associated commissions to 'rejected' (moves to history)
        // Use separate .eq() calls instead of .or() to avoid PostgREST filter
        // string parsing issues with special chars like '@' in email addresses.
        let updatedComms: { client_email: string; client_name: string }[] = [];

        // 3a. Direct hit by commission ID (most reliable)
        if (commissionId) {
            const { data } = await supabaseAdmin
                .from('commissions')
                .update({ status: 'rejected' })
                .eq('id', commissionId)
                .in('status', ['muted', 'banned'])
                .select('client_email, client_name');
            if (data && data.length > 0) updatedComms = data;
        }

        // 3b. Update any other commissions from same fingerprint
        if (hash) {
            await supabaseAdmin
                .from('commissions')
                .update({ status: 'rejected' })
                .eq('fingerprint_hash', hash)
                .in('status', ['muted', 'banned']);
        }

        // 3c. Update any other commissions from same email
        if (targetEmail) {
            const { data } = await supabaseAdmin
                .from('commissions')
                .update({ status: 'rejected' })
                .eq('client_email', targetEmail)
                .in('status', ['muted', 'banned'])
                .select('client_email, client_name');
            if (data && data.length > 0 && updatedComms.length === 0) updatedComms = data;

            await supabaseAdmin
                .from('commissions')
                .update({ status: 'rejected' })
                .eq('submitter_email', targetEmail)
                .in('status', ['muted', 'banned']);
        }



        // 4. Send "Restriction Lifted" Email
        targetEmail = targetEmail || (updatedComms && updatedComms.length > 0 ? updatedComms[0].client_email : null);
        
        if (targetEmail) {
            await sendEmail({
                to: targetEmail,
                subject: `Account Restriction Lifted – Atharva Sherlekar Art`,
                html: `
                    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.5;">
                        <h1>Restriction Lifted</h1>
                        <p>Hello,</p>
                        <p>We are pleased to inform you that the recent restriction on your account/device has been <strong>lifted</strong>.</p>
                        
                        <p>You are now free to submit new commission requests on our platform.</p>
                        
                        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 20px 0;">
                            <p style="margin: 0; color: #166534;"><strong>Your access has been fully restored.</strong></p>
                        </div>

                        <p>Thank you for your patience. If you have any further questions, feel free to reach out via <strong>Direct Message on Instagram (@atharva_sherlekar_art)</strong>.</p>
                        
                        <br />
                        <p>Regards,</p>
                        <p><strong>Atharva Sherlekar Art</strong></p>
                    </div>
                `
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting ban:', error);
        return NextResponse.json({ error: 'Failed to delete ban' }, { status: 500 });
    }
}
