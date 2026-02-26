import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { getAllCommissions, updateCommissionPayoutStatus } from '@/lib/commissions';
import { getAllReferrals } from '@/lib/referrals';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { commissionIds, paymentDetails } = body;
        // commissionIds: string[] - IDs of commissions to request payout for
        // paymentDetails: string - User provided info (UPI, Bank, etc.)

        if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
            return NextResponse.json({ error: 'No commissions selected' }, { status: 400 });
        }

        const userEmail = user.email!;

        // Disable verify-your-own-referral check for simplicity, 
        // relying on the fact that we only update commissions that match the user's referral code 
        // AND are eligible.

        const allCommissions = await getAllCommissions();
        const referrals = await getAllReferrals();
        const allReferrals = referrals.filter(r =>
            r.referrer_email.toLowerCase() === userEmail.toLowerCase()
        );
        const userReferralCodes = allReferrals.map(r => r.code);

        const commissionsToUpdate = [];
        let totalAmount = 0;

        for (const id of commissionIds) {
            const commission = allCommissions.find(c => c.id === id);

            if (!commission) continue;

            // Security Check: Must belong to one of user's referral codes
            if (!commission.referral_code || !userReferralCodes.includes(commission.referral_code)) {
                console.warn(`User ${userEmail} attempted to access commission ${id} not belonging to them.`);
                continue;
            }

            // Status Check: Must be completed
            if (commission.status !== 'completed') {
                continue;
            }

            // Payout Status Check: Must be unpaid
            if (commission.payout_status === 'requested' || commission.payout_status === 'paid') {
                continue;
            }

            commissionsToUpdate.push(commission);
            totalAmount += (commission.commission_amount || 0);
        }

        if (commissionsToUpdate.length === 0) {
            return NextResponse.json({ error: 'No eligible commissions found for payout' }, { status: 400 });
        }

        // Send Email to Admin
        const { error: emailError } = await resend.emails.send({
            from: 'Atharva Sherlekar Art <onboarding@resend.dev>',
            to: 'atharvasherlekarart@gmail.com',
            subject: `Payout Request from ${userEmail}`,
            html: `
                <h1>Payout Request</h1>
                <p><strong>Referrer:</strong> ${userEmail}</p>
                <p><strong>Amount:</strong> ₹${totalAmount}</p>
                <p><strong>Payment Details:</strong> ${paymentDetails || 'Not provided'}</p>
                
                <h2>Commissions</h2>
                <ul>
                    ${commissionsToUpdate.map(c => `
                        <li>
                            <strong>${c.client_name}</strong> - ₹${c.commission_amount} <br/>
                            ID: ${c.id} <br/>
                            Date: ${new Date(c.submitted_at).toLocaleDateString()}
                        </li>
                    `).join('')}
                </ul>

                <hr />
                <p>Please pay the user and then mark these commissions as "Paid" in the Admin Dashboard (Feature TBD/Manual for now).</p>
            `,
        });

        if (emailError) {
            console.error('Payout Email Error:', emailError);
            return NextResponse.json({
                error: `Failed to send payout request email: ${emailError.message || 'Unknown error'}`,
                details: emailError
            }, { status: 500 });
        }

        // Update Backend Status
        // We need a way to update ONLY the payout_status. 
        // `updateCommissionStatus` in `lib/commissions` updates the main status.
        // We might need to manually update here or modify the util. 
        // For safety, let's just write to file directly here OR (better) use a new util if we were strict, 
        // but since we are inside the API, we can just repurpose the save method if we had one exposed, 
        // or just read-modify-write.

        // Actually, let's modify `lib/commissions.ts` to export a generic update function 
        // or just handle it here by iterating. 
        // `updateCommissionStatus` is specific to the status state machine.

        let updatedCount = 0;

        for (const target of commissionsToUpdate) {
            const success = await updateCommissionPayoutStatus(target.id, 'requested');
            if (success) updatedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Payout requested for ${updatedCount} commissions`,
            count: updatedCount
        });
    } catch (error: unknown) {
        const err = error as { message?: string; stack?: string; name?: string };
        console.error('Payout Request Error Details:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        return NextResponse.json({
            error: err.message || 'Internal Server Error',
            details: err.stack
        }, { status: 500 });
    }
}
