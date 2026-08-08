import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminStatusUpdateSchema } from '@/lib/utils/schemas';
import { 
    getAllCommissions, 
    getCommissionById, 
    updateCommissionStatus, 
    updateCommissionPayoutStatus, 
    deleteCommission,
    getActiveWorkloadCount,
    promoteNextInWaitlist,
    type CommissionData
} from '@/lib/db/commissions';
import { setAvailability } from '@/lib/db/availability';

import { checkAdminAuth } from '@/lib/auth/admin-auth';
import { sendCommissionStatusEmail } from '@/lib/api/emails';
import { sendEmail } from '@/lib/api/email';

// Auth check is now handled by checkAdminAuth from @/lib/admin-auth

// GET: Return all commissions (Requires Admin Auth)
export async function GET() {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const commissions = await getAllCommissions();
        const { getAllOffers } = await import('@/lib/db/offers');
        const allOffers = await getAllOffers();

        // Sort by submission date (newest first)
        const sortedCommissions = commissions.sort((a: { submitted_at: string }, b: { submitted_at: string }) => {
            return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
        }).map((c) => {
            const row = c as unknown as Record<string, unknown>;
            if (row.promo_ids && Array.isArray(row.promo_ids)) {
                const appliedOffers = (row.promo_ids as string[])
                    .map((id: string) => allOffers.find(o => o.id === id))
                    .filter((o): o is NonNullable<typeof o> => !!o);
                return {
                    ...row,
                    promotion_codes: appliedOffers.map(o => o.code),
                    discount_percents: appliedOffers.map(o => o.discount_percent || 0),
                };
            }
            return row;
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

        const jsonBody = await request.json();
        const result = adminStatusUpdateSchema.safeParse(jsonBody);

        if (!result.success) {
            return NextResponse.json({ 
                error: 'Invalid input data', 
                details: result.error.issues.map((e: { message: string }) => e.message).join(', ') 
            }, { status: 400 });
        }

        const { id, status, admin_note, payout_status, payment_status } = result.data;

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

        // Update Manual Payment Status
        if (payment_status) {
            if (!['pending', 'reservation_paid', 'deposit_paid', 'fully_paid'].includes(payment_status)) {
                return NextResponse.json({ error: 'Invalid payment status value' }, { status: 400 });
            }
            const { updateCommissionPaymentStatus } = await import('@/lib/db/commissions');
            const result = await updateCommissionPaymentStatus(id, payment_status);
            if (result) {
                updatedCommission = result;
                // If manually updated to fully_paid, send confirmation email
                if (payment_status === 'fully_paid') {
                    const { sendCommissionStatusEmail } = await import('@/lib/api/emails');
                    await sendCommissionStatusEmail(updatedCommission, 'payment_fully_paid');
                }
            }
        }

        // Update Main Status
        if (status) {
            if (!['pending', 'accepted', 'in_progress', 'finished', 'on_delivery', 'completed', 'rejected', 'waitlist', 'cancelled'].includes(status)) {
                return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
            }
            try {
                const result = await updateCommissionStatus(id, status, admin_note || undefined);
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

                    // --- Offer Usage Restoration ---
                    // If a commission with a promo is rejected or cancelled, restore the spot
                    if (['rejected', 'cancelled'].includes(status) && existingCommission.promo_ids && existingCommission.promo_ids.length > 0) {
                        const { decrementOfferUsage } = await import('@/lib/db/offers');
                        for (const pid of existingCommission.promo_ids) {
                            await decrementOfferUsage(pid);
                            console.log(`Restored usage for offer ${pid} after status change to ${status}`);
                        }
                    }

                    // --- AUTOMATED LINK GENERATION REMOVED ---
                    // Links must now be generated manually from the dashboard after confirmation.


                    // --- Automated Emails for Status Changes ---
                    const emailTriggerStatuses = ['pending', 'accepted', 'in_progress', 'finished', 'on_delivery', 'completed', 'rejected', 'cancelled'];
                    // Only send email if status has actually CHANGED to prevent duplicate notifications on parallel requests
                    if (existingCommission.status !== status && emailTriggerStatuses.includes(status)) {
                        await sendCommissionStatusEmail(updatedCommission, status);

                        // Handle Referral Reward specifically
                        if (status === 'completed' && updatedCommission.referrer_info?.email && (updatedCommission.commission_amount ?? 0) > 0) {
                            const referrerEmail = updatedCommission.referrer_info.email;
                            const referrerName = updatedCommission.referrer_info.name;
                            const clientName = updatedCommission.client_name;
                            const commissionAmount = updatedCommission.commission_amount;

                            const referrerEmailDraft = `Hi ${referrerName},\n\nCongratulations! The commission request you referred for ${clientName} is now complete.\n\nYou have successfully earned ₹${commissionAmount} for this referral.\n\nPlease log into your referral dashboard and click "Request Payout" so I can send you your funds!\n\nThank you again for supporting my art!\n\nBest regards,\nAtharva Sherlekar Art`;

                            // Send Discord Notification to Admin
                            try {
                                const { sendDiscordNotification } = await import('@/lib/api/discord');
                                await sendDiscordNotification({
                                    content: '🎉 **Referral Commission Unlocked!**',
                                    embeds: [{
                                        title: 'Time to notify the referrer',
                                        description: `A commission referred by **${referrerName}** has been completed.`,
                                        color: 0x00FF00,
                                        fields: [
                                            { name: 'Referrer Email (To)', value: referrerEmail, inline: true },
                                            { name: 'Amount Earned', value: `₹${commissionAmount}`, inline: true },
                                            { name: 'Client Name', value: clientName, inline: true },
                                            { name: 'Email Draft (Copy-Paste)', value: `\`\`\`\n${referrerEmailDraft}\n\`\`\`` }
                                        ],
                                        timestamp: new Date().toISOString()
                                    }]
                                });
                            } catch (discordErr) {
                                console.error('Error sending Discord referrer notification:', discordErr);
                            }

                            try {
                                await sendEmail({
                                    to: referrerEmail,
                                    subject: 'You Earned a Commission! 🎉 – Atharva Sherlekar Art',
                                    html: `
                                        <h1>Congratulations, ${referrerName}!</h1>
                                        <p>The commission request you referred for <strong>${clientName}</strong> is now complete!</p>
                                        <p>You have successfully earned <strong>₹${commissionAmount}</strong> for this referral.</p>
                                        <p>Please log into your referral dashboard and click <strong>"Request Payout"</strong> so I can send you your funds!</p>
                                        <br/>
                                        <p>Thank you again for supporting my art!</p>
                                        <p>Best regards,</p>
                                        <p><strong>Atharva Sherlekar Art</strong></p>
                                    `,
                                });
                            } catch (err) {
                                console.error('Referrer email error:', err);
                            }
                        }
                    }
                }
        } catch (transitionError: unknown) {
            const errorMessage = transitionError instanceof Error ? transitionError.message : 'Invalid status transition';
            return NextResponse.json({
                error: errorMessage
            }, { status: 400 });
        }
        }

        // Update Submitted At
        if (result.data.submitted_at) {
            const { updateCommissionSubmittedAt } = await import('@/lib/db/commissions');
            const resultSubmittedAt = await updateCommissionSubmittedAt(id, result.data.submitted_at);
            if (resultSubmittedAt) updatedCommission = resultSubmittedAt;
        }

        // Update Client Name
        if (result.data.client_name) {
            const { updateCommissionClientName } = await import('@/lib/db/commissions');
            const resultClientName = await updateCommissionClientName(id, result.data.client_name);
            if (resultClientName) updatedCommission = resultClientName;
        }

        // Update Promo IDs
        if (result.data.promo_ids !== undefined || result.data.promotion_codes !== undefined) {
            const { supabaseAdmin } = await import('@/lib/supabase/admin');
            const { getAllOffers } = await import('@/lib/db/offers');
            const allOffers = await getAllOffers();

            // Fetch the commission's current promo_ids before overwriting
            const { data: currentCommission } = await supabaseAdmin
                .from('commissions')
                .select('promo_ids')
                .eq('id', id)
                .single();
            const previousIds: string[] = (currentCommission?.promo_ids as string[]) || [];

            // Resolve new IDs (either directly or from promotion_codes)
            let newIds: string[] = [];
            if (result.data.promo_ids !== undefined) {
                newIds = result.data.promo_ids;
            } else {
                newIds = (result.data.promotion_codes || [])
                    .map((code: string) => allOffers.find(o => o.code.toUpperCase() === code.toUpperCase())?.id)
                    .filter(Boolean) as string[];
            }

            // Save updated promo_ids to commission
            const { data, error } = await supabaseAdmin
                .from('commissions')
                .update({ promo_ids: newIds })
                .eq('id', id)
                .select()
                .single();
            if (!error && data) {
                updatedCommission = data;
            }

            // Diff: increment usage for newly added, decrement for removed
            const added = newIds.filter(nid => !previousIds.includes(nid));
            const removed = previousIds.filter(pid => !newIds.includes(pid));

            for (const offerId of added) {
                const currentUsage = allOffers.find(o => o.id === offerId)?.usage_count ?? 0;
                await supabaseAdmin.from('offers').update({ usage_count: currentUsage + 1 }).eq('id', offerId);
            }
            for (const offerId of removed) {
                const currentUsage = allOffers.find(o => o.id === offerId)?.usage_count ?? 0;
                if (currentUsage > 0) {
                    await supabaseAdmin.from('offers').update({ usage_count: currentUsage - 1 }).eq('id', offerId);
                }
            }
        }

        // Re-enrich updatedCommission with promotion_codes + discount_percents if it has promo_ids
        if (updatedCommission && (updatedCommission as unknown as Record<string, unknown>).promo_ids) {
            const { getAllOffers } = await import('@/lib/db/offers');
            const allOffers = await getAllOffers();
            const promoIds = (updatedCommission as unknown as Record<string, unknown>).promo_ids as string[];
            const appliedOffers = promoIds
                .map((pid: string) => allOffers.find(o => o.id === pid))
                .filter(Boolean);
            updatedCommission = {
                ...(updatedCommission as unknown as Record<string, unknown>),
                promotion_codes: appliedOffers.map(o => o!.code),
                discount_percents: appliedOffers.map(o => o!.discount_percent || 0),
            } as unknown as CommissionData;
        }

        // Update Payout Status
        if (payout_status) {
            if (!['unpaid', 'requested', 'paid'].includes(payout_status)) {
                return NextResponse.json({ error: 'Invalid payout status value' }, { status: 400 });
            }

            // MANUAL-ASSIST PAYOUT LOGIC:
            // We no longer trigger RazorpayX automatically to avoid needing escrow balances
            // and to support PayPal/International transfers via manual process.
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

