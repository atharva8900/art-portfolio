import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { saveReferral, hashIP, getActiveReferralForUser } from '@/lib/referrals';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';



export const dynamic = 'force-dynamic';

// Helper to extract IP from request
function getClientIP(request: NextRequest): string {
    // Check various headers for IP (in order of priority)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (forwarded) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwarded.split(',')[0].trim();
    }

    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;

    // Fallback (should not happen in production)
    return 'unknown';
}

export async function POST(request: NextRequest) {
    try {
        // Verify user is authenticated via NextAuth
        const session = await getServerSession(authOptions);
        const user = session?.user;

        if (!user) {
            return NextResponse.json({ error: 'Authentication required. Please sign in to create a referral link.' }, { status: 401 });
        }

        // IP-based Geo-blocking restriction has been removed to allow global referrers.
        const country = request.headers.get('x-vercel-ip-country');

        const body = await request.json();
        const { name, email, phone, instagram, turnstile_token } = body;

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
        }

        if (email !== user.email) {
            return NextResponse.json({ error: 'Email must match your logged-in account' }, { status: 403 });
        }

        // --- Turnstile Verification ---
        if (!turnstile_token) {
            return NextResponse.json({ error: 'CAPTCHA token missing' }, { status: 403 });
        }

        const verifyResponse = await fetch(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${encodeURIComponent(process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA')}&response=${encodeURIComponent(turnstile_token)}`,
            }
        );

        const verifyData = await verifyResponse.json();
        if (!verifyData.success) {
            console.error('Turnstile verification failed (Referrals):', verifyData);
            return NextResponse.json({ error: 'Invalid CAPTCHA' }, { status: 403 });
        }
        // ------------------------------

        // Check for existing active referral link
        const activeReferral = await getActiveReferralForUser(email);
        if (activeReferral) {
            return NextResponse.json({
                success: true,
                referral_code: activeReferral.code,
                referrer_name: activeReferral.referrer_name,
                referrer_email: activeReferral.referrer_email,
                referrer_phone: activeReferral.referrer_phone,
                message: 'You already have an active referral link.'
            });
        }

        // Generate Referral Code
        // Format: First 3 letters of name (uppercase) + 5 random chars
        const prefix = name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
        const randomString = Math.random().toString(36).substring(2, 7).toUpperCase();
        const referralCode = `${prefix}-${randomString}`;

        // Extract and hash IP address
        const clientIP = getClientIP(request);
        const ipHash = hashIP(clientIP);

        // Store referral in JSON file
        try {
            await saveReferral({
                code: referralCode,
                referrer_email: email,
                referrer_name: name,
                referrer_phone: phone,
                referrer_instagram: instagram,
                referrer_user_id: user.email || undefined, // Use email as identifier for NextAuth
                created_at: new Date().toISOString(),
                ip_hash: ipHash,
                successful_referrals_count: 0,
                used_by_emails: [],
                ip_submissions: [], // Initialize empty IP tracking array
            });
        } catch (storageError) {
            console.error('Failed to store referral:', storageError);
            return NextResponse.json({ error: 'Failed to save referral' }, { status: 500 });
        }

        // Send Email to Artist via Gmail SMTP
        const { error: emailError } = await sendEmail({
            to: 'atharvasherlekarart@gmail.com',
            subject: 'New Referral Link Generated',
            html: `
                <h1>New Referral Registrant</h1>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                <p><strong>Generated Code:</strong> ${referralCode}</p>
                <hr />
                <p>Save this code. If a commission comes in with this code, you owe this person 20%.</p>
            `,
        });

        if (emailError) {
            console.error('Referral Email Error:', emailError);
        }

        return NextResponse.json({
            success: true,
            referral_code: referralCode,
            referrer_name: name,
            referrer_email: email,
            referrer_phone: phone
        });

    } catch (error: unknown) {
        const err = error as { message?: string };
        console.error('Handler Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
