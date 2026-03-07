import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCommissionById } from '@/lib/commissions';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendDiscordNotification } from '@/lib/discord';

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com'];

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email || !ALLOWED_EMAILS.includes(session.user.email.toLowerCase())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id;
        const commission = await getCommissionById(id);

        if (!commission) {
            return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
        }

        const hasPaidReservation = commission.payment_status === 'reservation_paid';

        if (commission.status !== 'accepted' && !(commission.status === 'waitlist' && hasPaidReservation)) {
            return NextResponse.json({ error: 'Commission must be accepted or a waitlist reservation to request a deposit' }, { status: 400 });
        }

        if (commission.payment_status === 'deposit_paid' || commission.payment_status === 'fully_paid') {
            return NextResponse.json({ error: 'Payment has already been made' }, { status: 400 });
        }

        const basePrice = commission.base_price || 0;
        const extrasTotal = commission.extras_total || 0;
        const totalAmount = basePrice + extrasTotal;

        if (totalAmount <= 0) {
            return NextResponse.json({ error: 'Commission total amount must be greater than zero' }, { status: 400 });
        }

        // Calculate Deposit Amount
        let depositAmount = Math.ceil(totalAmount / 2);

        if (hasPaidReservation) {
            // Already paid approximately 25%, calculate remaining 25% (totaling 50%)
            const alreadyPaid = Math.round(totalAmount * 0.25);
            depositAmount = Math.ceil(totalAmount / 2) - alreadyPaid;
        }

        // Razorpay expects amount in paise (multiply by 100)
        const amountInPaise = depositAmount * 100;

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            accept_partial: false,
            description: hasPaidReservation
                ? `Remaining 25% Deposit for Commission ${id} (Waitlist)`
                : `50% Deposit for Commission ${id}`,
            customer: {
                name: commission.client_name,
                email: commission.client_email,
                contact: commission.phone || undefined
            },
            notify: {
                sms: false,
                email: false
            },
            reminder_enable: false,
            reference_id: id,
            notes: {
                commission_id: id,
                payment_type: hasPaidReservation ? 'reservation_completion' : 'deposit'
            },
            callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/client/dashboard`,
            callback_method: 'get'
        };

        const paymentLink = await razorpay.paymentLink.create(options);

        // Update database with payment link ID and status
        const { error: updateError } = await supabaseAdmin
            .from('commissions')
            .update({
                razorpay_payment_link_id: paymentLink.id,
                razorpay_payment_link_url: paymentLink.short_url,
                payment_status: 'pending',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating commission with payment link:', updateError);
            return NextResponse.json({ error: 'Failed to update commission with link' }, { status: 500 });
        }

        // Send Discord Notification to Admin so they can copy-paste it!
        const discordEmailDraft = `Hi ${commission.client_name},

Your commission request has been accepted!

To secure your slot and allow me to begin working on your drawing, please complete the 50% deposit payment of ₹${depositAmount}.

You can make the payment securely using this Razorpay link:
${paymentLink.short_url}

Thank you for choosing my art!

Best regards,
Atharva Sherlekar`;

        try {
            await sendDiscordNotification({
                content: '🔗 **New Payment Link Generated!**',
                embeds: [{
                    title: 'Payment Link Ready to Send',
                    description: hasPaidReservation
                        ? `You generated the remaining 25% payment link for **${commission.client_name}** (Waitlist completion).`
                        : `You generated a 50% deposit payment link for **${commission.client_name}**.`,
                    color: hasPaidReservation ? 0xf59e0b : 0x3b82f6, // Amber for waitlist, Blue for regular
                    fields: [
                        { name: 'Client Name', value: commission.client_name, inline: true },
                        { name: 'Deposit Amount', value: `₹${depositAmount}`, inline: true },
                        { name: 'Payment Link', value: paymentLink.short_url, inline: false },
                        { name: 'Message Draft (Copy-Paste to client)', value: `\`\`\`text\n${discordEmailDraft}\n\`\`\``, inline: false }
                    ],
                    timestamp: new Date().toISOString()
                }]
            });
        } catch (discordErr) {
            console.error('Error sending Discord payment link notification:', discordErr);
            // Non-blocking error
        }

        // Redundant email notification removed (handled by status update API)

        return NextResponse.json({
            success: true,
            link: paymentLink.short_url,
            id: paymentLink.id
        });

    } catch (error: unknown) {
        console.error('Error generating payment link:', error);
        return NextResponse.json({ error: (error as Error).message || 'Failed to generate payment link' }, { status: 500 });
    }
}
