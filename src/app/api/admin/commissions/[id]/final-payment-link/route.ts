import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

import { getCommissionById } from '@/lib/commissions';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendDiscordNotification } from '@/lib/discord';

import { checkAdminAuth } from '@/lib/admin-auth';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id;
        const body = await request.json();
        const { shippingCost } = body;

        const commission = await getCommissionById(id);

        if (!commission) {
            return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
        }

        // Allow generating final link if status is 'finished' or 'on_delivery' (for retries)
        if (!['finished', 'on_delivery'].includes(commission.status)) {
            return NextResponse.json({ error: 'Commission status must be "Finished" to generate final payment link' }, { status: 400 });
        }

        if (commission.payment_status === 'fully_paid') {
            return NextResponse.json({ error: 'Commission is already fully paid' }, { status: 400 });
        }

        const basePrice = commission.base_price || 0;
        const extrasTotal = commission.extras_total || 0;
        const totalAmount = basePrice + extrasTotal;
        const shipping = Number(shippingCost) || 0;

        // Remaining 50% + Shipping
        // Total = Deposit(ceil) + Remaining. 
        // Example: 1001. Deposit = 501. Remaining = 500.
        const depositAmount = Math.ceil(totalAmount / 2);
        const actualRemaining = totalAmount - depositAmount;

        const finalBalance = actualRemaining + shipping;

        if (finalBalance <= 0) {
            return NextResponse.json({ error: 'Final balance must be greater than zero' }, { status: 400 });
        }

        // Razorpay expects amount in paise (multiply by 100)
        const amountInPaise = finalBalance * 100;

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            accept_partial: false,
            description: `Final Payment for Commission ${id} (incl. Shipping)`,
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
            reference_id: `${id}_final`,
            notes: {
                commission_id: id,
                payment_type: 'final'
            },
            callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/client/dashboard`,
            callback_method: 'get'
        };

        const paymentLink = await razorpay.paymentLink.create(options);

        // Update database with final payment link details and shipping cost
        const { error: updateError } = await supabaseAdmin
            .from('commissions')
            .update({
                shipping_cost: shipping,
                final_payment_link_id: paymentLink.id,
                final_payment_link_url: paymentLink.short_url,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating commission with final payment link:', updateError);
            return NextResponse.json({ error: 'Failed to update commission with link' }, { status: 500 });
        }

        // Send Discord Notification with Final Invoice Draft
        const discordInvoiceDraft = `Hi ${commission.client_name},
        
Your artwork is now FINISHED! 🎨✨ I'm so excited to share the final result with you. I've attached a picture for your approval.

To proceed with the shipping via DTDC, please complete the remaining 50% payment plus the delivery charges.

**Final Invoice Breakdown:**
- Total Artwork Price: ₹${totalAmount}
- Deposit Paid: -₹${depositAmount}
- Shipping Charges: +₹${shipping}
---------------------------
- **Total Balance Due: ₹${finalBalance}**

You can make the final payment securely here:
${paymentLink.short_url}

Once paid, I will drop the package at DTDC and send you the tracking ID immediately!

Best regards,
Atharva Sherlekar`;

        try {
            await sendDiscordNotification({
                content: '📦 **Final Payment Link & Invoice Generated!**',
                embeds: [{
                    title: 'Artwork Finished - Final Link Ready',
                    description: `You generated the final shipping + balance link for **${commission.client_name}**.`,
                    color: 0x10b981, // Emerald
                    fields: [
                        { name: 'Client Name', value: commission.client_name, inline: true },
                        { name: 'Total Price', value: `₹${totalAmount}`, inline: true },
                        { name: 'Shipping Cost', value: `₹${shipping}`, inline: true },
                        { name: 'Final Balance', value: `₹${finalBalance}`, inline: true },
                        { name: 'Payment Link', value: paymentLink.short_url, inline: false },
                        { name: 'Invoice Message Draft', value: `\`\`\`text\n${discordInvoiceDraft}\n\`\`\``, inline: false }
                    ],
                    timestamp: new Date().toISOString()
                }]
            });
        } catch (discordErr) {
            console.error('Error sending Discord final invoice notification:', discordErr);
        }

        return NextResponse.json({
            success: true,
            link: paymentLink.short_url,
            id: paymentLink.id,
            finalBalance
        });

    } catch (error: unknown) {
        console.error('Error generating final payment link:', error);
        return NextResponse.json({ error: (error as Error).message || 'Failed to generate final payment link' }, { status: 500 });
    }
}
