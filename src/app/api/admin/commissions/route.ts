import { NextRequest, NextResponse } from 'next/server';
import { getAllCommissions, updateCommissionStatus, getCommissionById, deleteCommission, updateCommissionPayoutStatus, getActiveWorkloadCount } from '@/lib/commissions';
import { setAvailability } from '@/lib/availability';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
            if (!['pending', 'accepted', 'in_progress', 'on_delivery', 'completed', 'rejected'].includes(status)) {
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

                    // --- Automated Emails for Status Changes ---
                    const emailTriggerStatuses = ['accepted', 'in_progress', 'on_delivery', 'completed'];
                    if (emailTriggerStatuses.includes(status)) {
                        const resend = new Resend(process.env.RESEND_API_KEY);
                        try {
                            let subject = '';
                            let htmlContent = '';

                            switch (status) {
                                case 'accepted':
                                    const isFromWaitlist = existingCommission.status === 'waitlist';
                                    subject = isFromWaitlist
                                        ? 'Your Waitlist Slot is Ready! – Atharva Sherlekar Art'
                                        : 'Your Commission Request has been Accepted! – Atharva Sherlekar Art';

                                    htmlContent = isFromWaitlist ? `
                                        <h1>Good news—your slot is ready!</h1>
                                        <p>Hi ${updatedCommission.client_name},</p>
                                        <p>You were on the waitlist, and a slot has just opened up for you!</p>
                                        <p>To begin the artwork, please pay the <strong>remaining 25%</strong> of the base portrait price (this brings your total deposit to 50%). Add-ons and delivery will be charged in the final invoice.</p>
                                        <p>I will reach out to you shortly via DM or Email with the payment link to officially start your commission.</p>
                                        <br/>
                                        <p>Check your order status anytime on the <a href="https://atharvasherlekar.com/commission">Commission Page</a>.</p>
                                        <p>Best regards,</p>
                                        <p><strong>Atharva Sherlekar</strong></p>
                                    ` : `
                                        <h1>Great news!</h1>
                                        <p>Hi ${updatedCommission.client_name},</p>
                                        <p>Your commission request has been <strong>accepted</strong>!</p>
                                        <p>To begin the artwork, I require a <strong>50% advance payment</strong> of the base portrait price (Add-ons and delivery will be charged in the final invoice).</p>
                                        <p>I will reach out to you shortly via DM or Email to finalize the details and provide payment instructions.</p>
                                        <br/>
                                        <p>Check your order status anytime on the <a href="https://atharvasherlekar.com/commission">Commission Page</a>.</p>
                                        <p>Best regards,</p>
                                        <p><strong>Atharva Sherlekar</strong></p>
                                    `;
                                    break;
                                case 'in_progress':
                                    subject = 'Drawing Started! – Atharva Sherlekar Art';
                                    htmlContent = `
                                        <h1>Payment Received</h1>
                                        <p>Hi ${updatedCommission.client_name},</p>
                                        <p>Your payment has been received and I have officially <strong>started drawing</strong> your commission!</p>
                                        <p>I\'m excited to bring your vision to life. I will keep you updated if I have any questions during the process.</p>
                                        <br/>
                                        <p>Check progress anytime on the <a href="https://atharvasherlekar.com/commission">Commission Page</a>.</p>
                                        <p>Best regards,</p>
                                        <p><strong>Atharva Sherlekar</strong></p>
                                    `;
                                    break;
                                case 'on_delivery':
                                    subject = 'Your Artwork is Finished! Final Details – Atharva Sherlekar Art';
                                    htmlContent = `
                                        <h1>Your Artwork is Ready!</h1>
                                        <p>Hi ${updatedCommission.client_name},</p>
                                        <p>The drawing is <strong>complete</strong>! I am now preparing it for delivery.</p>
                                        <p>I have sent you the <strong>final invoice</strong> via our previous communication channel, which includes:</p>
                                        <ul>
                                            <li>The remaining 50% of the portrait price</li>
                                            <li>Add-ons (Detailed background/Timelapse)</li>
                                            <li>Delivery/Shipping costs</li>
                                        </ul>
                                        <p>Once the final payment is cleared, I will ship your artwork and update you with the tracking details.</p>
                                        <br/>
                                        <p>Best regards,</p>
                                        <p><strong>Atharva Sherlekar</strong></p>
                                    `;
                                    break;
                                case 'completed':
                                    subject = 'Enjoy your artwork! – Atharva Sherlekar Art';
                                    htmlContent = `
                                        <h1>Commission Completed</h1>
                                        <p>Hi ${updatedCommission.client_name},</p>
                                        <p>Your commission has been marked as <strong>completed</strong>!</p>
                                        <p>Thank you so much for choosing my art. I hope you love the final result.</p>
                                        <p>If you have a moment, I\'d love to see a photo of it in its new home—feel free to tag me on Instagram!</p>
                                        <br/>
                                        <p>Best regards,</p>
                                        <p><strong>Atharva Sherlekar</strong></p>
                                    `;
                                    break;
                            }

                            const toEmail = updatedCommission.client_email;

                            console.log(`[Resend Debug] Attempting to send ${status} email to ${toEmail} (intended for ${updatedCommission.client_email})...`);
                            const { data, error } = await resend.emails.send({
                                from: 'Atharva Sherlekar Art <onboarding@resend.dev>', // Replace with verified domain in production
                                to: toEmail,
                                subject,
                                html: htmlContent,
                            });

                            if (error) {
                                console.error(`[Resend Error] Failed to send ${status} email to ${updatedCommission.client_email}:`, JSON.stringify(error));
                            } else {
                                console.log(`[Resend Success] Sent ${status} email to ${updatedCommission.client_email}, ID: ${data?.id}`);
                            }

                            // --- Referrer Notification for Completed Commission ---
                            if (status === 'completed' && updatedCommission.referrer_info?.email && (updatedCommission.commission_amount ?? 0) > 0) {
                                try {
                                    console.log(`[Resend Debug] Attempting to send Commission Earned email to referrer ${updatedCommission.referrer_info.email}...`);

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
                                    console.log(`[Resend Success] Sent Commission Earned email to referrer ${updatedCommission.referrer_info.email}.`);
                                } catch (referrerEmailError) {
                                    console.error('[Resend Debug] Failed to send Commission Earned email to referrer:', referrerEmailError);
                                }
                            }

                        } catch (emailError) {
                            console.error('[Resend Debug] Unexpected exception when sending status update email:', emailError);
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
