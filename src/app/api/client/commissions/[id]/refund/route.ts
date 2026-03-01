import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCommissionById } from '@/lib/commissions';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id;
        const commission = await getCommissionById(id);

        if (!commission) {
            return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
        }

        // Verify ownership
        if (commission.client_email !== session.user.email.toLowerCase()) {
            return NextResponse.json({ error: 'Unauthorized to refund this commission' }, { status: 403 });
        }

        // Verify status and time window
        if (commission.status !== 'in_progress' || !commission.payment_completed_at || !commission.razorpay_payment_id) {
            return NextResponse.json({ error: 'This commission is not eligible for refund' }, { status: 400 });
        }

        const paymentDate = new Date(commission.payment_completed_at);
        const now = new Date();
        const diffHours = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60);

        if (diffHours > 48) {
            return NextResponse.json({ error: 'The 48-hour refund window has passed' }, { status: 400 });
        }

        // Proceed to refund via Razorpay
        // Razorpay automatically refunds the full amount of that payment ID if no amount is passed
        const refundResponse = await razorpay.payments.refund(commission.razorpay_payment_id, {
            notes: {
                reason: 'Client requested cancellation within 48h limit',
                commission_id: id
            }
        });

        // Update database
        const { error: updateError } = await supabaseAdmin
            .from('commissions')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Database update failed after refund:', updateError);
            return NextResponse.json({ error: 'Refund processed but failed to update status.' }, { status: 500 });
        }

        // Send Email Notifications
        try {
            const { sendCommissionStatusEmail } = await import('@/lib/emails');
            await sendCommissionStatusEmail(commission, 'cancelled');
        } catch (e) {
            console.error('Failed to send cancellation email:', e);
        }

        // Send a discord notification about the cancellation
        try {
            const { sendDiscordNotification } = await import('@/lib/discord');
            await sendDiscordNotification({
                content: '⚠️ **Commission Cancelled & Refunded!**',
                embeds: [{
                    title: 'Client Requested Refund',
                    description: `**${commission.client_name}** cancelled their commission within 48h and received a refund.`,
                    color: 0xef4444, // Red
                    fields: [
                        { name: 'Commission ID', value: id, inline: true },
                        { name: 'Refund ID', value: refundResponse.id, inline: true }
                    ],
                    timestamp: new Date().toISOString()
                }]
            });
        } catch {
            // ignore
        }

        return NextResponse.json({ success: true, refundId: refundResponse.id });

    } catch (error: unknown) {
        console.error('Refund Error:', error);
        return NextResponse.json({ error: (error as Error).message || 'Refund processing failed' }, { status: 500 });
    }
}
