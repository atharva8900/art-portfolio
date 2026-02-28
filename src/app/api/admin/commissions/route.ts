import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getAllCommissions, updateCommissionStatus, getCommissionById, deleteCommission, updateCommissionPayoutStatus, getActiveWorkloadCount, promoteNextInWaitlist } from '@/lib/commissions';
import { setAvailability } from '@/lib/availability';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendCommissionStatusEmail } from '@/lib/emails';
import { Resend } from 'resend';

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com'];

async function checkAdminAuth() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return false;
    }

    return ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
}

// GET: Return all commissions (Requires Admin Auth)
export async function GET() {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const commissions = await getAllCommissions();

        // Sort by submission date (newest first)
        const sortedCommissions = commissions.sort((a: { submitted_at: string }, b: { submitted_at: string }) => {
            return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
        });

        return NextResponse.json({ commissions: sortedCommissions });

    } catch (error) {
        console.error('Error fetching commissions:', error);
        return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
    }
}

// PATCH: Update commission status (Requires Admin Auth)
export async function PATCH(request: NextRequest) {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, status, admin_note, payout_status } = body;

        // Validate inputs
        if (!id) {
            return NextResponse.json({ error: 'Missing commission ID' }, { status: 400 });
        }

        // Check if commission exists
        const existingCommission = await getCommissionById(id);
        if (!existingCommission) {
            return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
        }

        let updatedCommission = existingCommission;

        // Update Main Status
        if (status) {
            if (!['pending', 'accepted', 'in_progress', 'on_delivery', 'completed', 'rejected', 'waitlist'].includes(status)) {
                return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
            }
            try {
                const result = await updateCommissionStatus(id, status, admin_note);
                if (result) {
                    updatedCommission = result;

                    // Auto-Close/Open based on TOTAL WORKLOAD slots (limit 4)
                    const activeWorkload = await getActiveWorkloadCount();

                    if (activeWorkload >= 4) {
                        await setAvailability(false);
                        console.log(`Active workload: ${activeWorkload}. Auto-closing.`);
                    } else {
                        await setAvailability(true);
                        console.log(`Active workload: ${activeWorkload}. Auto-opening.`);
                    }

                    // --- Auto-Promotion Check ---
                    // Trigger promotion if a slot is freed (rejected/completed)
                    if (['rejected', 'completed'].includes(status)) {
                        console.log(`Status changed to ${status}. Checking for waitlist promotion...`);
                        const promoted = await promoteNextInWaitlist();
                        if (promoted) {
                            console.log(`Promoted ${promoted.client_name} from waitlist to ${promoted.status}.`);
                            // Send email to promoted user
                            await sendCommissionStatusEmail(promoted, promoted.status);
                        }
                    }

                    // --- Automated Emails for Status Changes ---
                    const emailTriggerStatuses = ['pending', 'accepted', 'in_progress', 'on_delivery', 'completed', 'rejected'];
                    if (emailTriggerStatuses.includes(status)) {
                        await sendCommissionStatusEmail(updatedCommission, status);

                        // Handle Referral Reward Email specifically
                        if (status === 'completed' && updatedCommission.referrer_info?.email && (updatedCommission.commission_amount ?? 0) > 0) {
                            const resend = new Resend(process.env.RESEND_API_KEY);
                            try {
                                await resend.emails.send({
                                    from: 'Atharva Sherlekar Art <onboarding@resend.dev>',
                                    to: updatedCommission.referrer_info.email,
                                    subject: 'You Earned a Commission! 🎉 – Atharva Sherlekar Art',
                                    html: `
                                        <h1>Congratulations, ${updatedCommission.referrer_info.name}!</h1>
                                        <p>The commission request you referred for <strong>${updatedCommission.client_name}</strong> is now complete!</p>
                                        <p>You have successfully earned <strong>₹${updatedCommission.commission_amount}</strong> for this referral.</p>
                                        <p>Please log into your referral dashboard and click <strong>"Request Payout"</strong> so I can send you your funds!</p>
                                        <br/>
                                        <p>Thank you again for supporting my art!</p>
                                        <p>Best regards,</p>
                                        <p><strong>Atharva Sherlekar</strong></p>
                                    `,
                                });
                            } catch (err) {
                                console.error('Referrer email error:', err);
                            }
                        }
                    }
                }
            } catch (transitionError: unknown) {
                return NextResponse.json({
                    error: (transitionError as { message?: string }).message || 'Invalid status transition'
                }, { status: 400 });
            }
        }

        // Update Payout Status
        if (payout_status) {
            if (!['unpaid', 'requested', 'paid'].includes(payout_status)) {
                return NextResponse.json({ error: 'Invalid payout status value' }, { status: 400 });
            }
            const success = await updateCommissionPayoutStatus(id, payout_status);
            if (success) {
                const refreshed = await getCommissionById(id);
                if (refreshed) updatedCommission = refreshed;
            }
        }

        return NextResponse.json({
            success: true,
            commission: updatedCommission
        });

    } catch (error) {
        console.error('Error updating commission:', error);
        return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
    }
}

// DELETE: Remove a commission (Requires Admin Auth)
export async function DELETE(request: NextRequest) {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Commission ID is required' }, { status: 400 });
        }

        const success = await deleteCommission(id);

        if (!success) {
            return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting commission:', error);
        return NextResponse.json({ error: 'Failed to delete commission' }, { status: 500 });
    }
}
