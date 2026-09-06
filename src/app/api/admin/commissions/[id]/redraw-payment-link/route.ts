import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getCommissionById } from '@/lib/db/commissions';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendDiscordNotification } from '@/lib/api/discord';
import { checkAdminAuth } from '@/lib/auth/admin-auth';

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
        const commission = await getCommissionById(id);

        if (!commission) {
            return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
        }

        const basePrice = Number(commission.base_price || 0);
        const extrasTotal = Number(commission.extras_total || 0);
        const rushFee = Number(commission.rush_fee || 0);
        const totalAmount = (basePrice + extrasTotal + rushFee) || Number(commission.commission_amount || 0);

        if (totalAmount <= 0) {
            return NextResponse.json({ error: 'Commission total amount must be greater than zero' }, { status: 400 });
        }

        // Calculate 70% Discounted Redraw Amount (Client pays 30%)
        const redrawAmount = Math.max(1, Math.round(totalAmount * 0.30));
        const amountInPaise = redrawAmount * 100;

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            accept_partial: false,
            description: `70% Discounted Redraw for Commission #${id.slice(0, 8).toUpperCase()}`,
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
                payment_type: 'redraw',
                original_total: totalAmount.toString(),
                discount: '70%'
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
                status: 'redrawing',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating commission with redraw payment link:', updateError);
            return NextResponse.json({ error: 'Failed to update commission with link' }, { status: 500 });
        }

        // Send Discord Notification
        try {
            await sendDiscordNotification({
                content: '🎨 **Redraw Payment Link (70% Off) Generated!**',
                embeds: [{
                    title: 'Redraw Link Ready',
                    description: `You generated a 70% discounted redraw payment link for **${commission.client_name}**.`,
                    color: 0xf59e0b, // Amber
                    fields: [
                        { name: 'Client Name', value: commission.client_name, inline: true },
                        { name: 'Original Price', value: `₹${totalAmount.toLocaleString('en-IN')}`, inline: true },
                        { name: 'Redraw Amount (30%)', value: `₹${redrawAmount.toLocaleString('en-IN')}`, inline: true },
                        { name: 'Payment Link', value: paymentLink.short_url, inline: false }
                    ],
                    timestamp: new Date().toISOString()
                }]
            });
        } catch (discordErr) {
            console.error('Error sending Discord redraw notification:', discordErr);
        }

        return NextResponse.json({
            success: true,
            link: paymentLink.short_url,
            id: paymentLink.id,
            redrawAmount
        });

    } catch (error: unknown) {
        console.error('Error generating redraw payment link:', error);
        return NextResponse.json({ error: (error as Error).message || 'Failed to generate redraw payment link' }, { status: 500 });
    }
}
