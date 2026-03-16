import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCommissionById } from '@/lib/db/commissions';

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
    try {
        const bodyText = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        if (!signature || !WEBHOOK_SECRET) {
            console.warn('Razorpay webhook missing signature or secret not configured');
            // If secret is not configured in local dev, allow bypass ONLY IF we explicitly allow it (for safety, better to fail in prod)
            if (process.env.NODE_ENV === 'production' || WEBHOOK_SECRET) {
                return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
            }
        } else {
            // Validate signature
            const expectedSignature = crypto
                .createHmac('sha256', WEBHOOK_SECRET)
                .update(bodyText)
                .digest('hex');

            if (expectedSignature !== signature) {
                console.error('Invalid Razorpay Webhook Signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
            }
        }

        const event = JSON.parse(bodyText);

        // We are interested in payment_link.paid
        if (event.event === 'payment_link.paid') {
            const paymentLink = event.payload.payment_link.entity;
            const paymentId = event.payload.payment.entity.id;
            const commissionId = paymentLink.notes?.commission_id || paymentLink.reference_id;
            const paymentType = paymentLink.notes?.payment_type; // 'final' or undefined/null/deposit

            if (commissionId) {
                // Update commission
                const commission = await getCommissionById(commissionId);

                if (commission) {
                    const isFinalPayment = paymentType === 'final';
                    const isReservationCompletion = paymentType === 'reservation_completion';

                    const updateData: Record<string, string> = {
                        razorpay_payment_id: paymentId,
                        payment_completed_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    if (isFinalPayment) {
                        updateData.payment_status = 'fully_paid';
                        // Keep the status as finished until admin marks as on_delivery
                        // or if it was already on_delivery, keep it.
                    } else if (isReservationCompletion) {
                        updateData.payment_status = 'deposit_paid';
                        updateData.status = 'in_progress';
                    } else {
                        updateData.payment_status = 'deposit_paid';
                        updateData.status = 'in_progress'; // unlocking 48h refund window
                    }

                    const { error } = await supabaseAdmin
                        .from('commissions')
                        .update(updateData)
                        .eq('id', commissionId);

                    if (error) {
                        console.error('Error updating commission on Razorpay webhook:', error);
                        return NextResponse.json({ error: 'Internal database error' }, { status: 500 });
                    }

                    // Send auto-email to client confirming we received their payment
                    try {
                        const { sendCommissionStatusEmail } = await import('@/lib/api/emails');
                        if (isFinalPayment) {
                            await sendCommissionStatusEmail(commission, 'payment_fully_paid');
                        }
                    } catch (emailErr) {
                        console.error('Error sending confirmation email from webhook:', emailErr);
                    }

                    // Optional: Send auto-email to client confirming we received their payment
                    try {
                        const { sendDiscordNotification } = await import('@/lib/api/discord');
                        await sendDiscordNotification({
                            content: isFinalPayment ? '💰 **Final Payment Received!**' : (isReservationCompletion ? '💰 **Reservation Completion Received!**' : '💰 **Deposit Received!**'),
                            embeds: [{
                                title: isFinalPayment ? 'Commission Fully Paid' : 'Payment Link Paid',
                                description: isFinalPayment
                                    ? `**${commission.client_name}** has paid the remaining balance! The artwork is ready to be shipped.`
                                    : isReservationCompletion
                                        ? `**${commission.client_name}** just paid the remaining 25% to complete their waitlist reservation! The commission is now officially booked and IN PROGRESS.`
                                        : `**${commission.client_name}** just paid the 50% deposit via their payment link! The commission is now IN PROGRESS.`,
                                color: isFinalPayment ? 0xec4899 : 0x10b981, // Pink for final, Green for deposit
                                fields: [
                                    { name: 'Commission ID', value: commissionId, inline: true },
                                    { name: 'Payment ID', value: paymentId, inline: true }
                                ]
                            }]
                        });
                    } catch {
                        // Non-blocking
                    }
                }
            }
        }

        // Return 200 OK so Razorpay knows we received it
        return NextResponse.json({ status: 'ok' });

    } catch (error: unknown) {
        console.error('Razorpay Webhook Error:', error);
        return NextResponse.json({ error: (error as Error).message || 'Webhook processing failed' }, { status: 500 });
    }
}

