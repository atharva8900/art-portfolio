import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CommissionData } from '@/lib/db/commissions';
import type { OfferData } from '@/lib/db/offers';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = session.user.email.toLowerCase().trim();
        console.log('DEBUG: Fetching dashboard commissions for email:', email);

        // Fetch commissions matching the user's email (case-insensitive and trimmed)
        const { data: commissions, error } = await supabaseAdmin
            .from('commissions')
            .select('*')
            .ilike('client_email', email)
            .order('submitted_at', { ascending: false });

        if (error) {
            console.error('Error fetching client commissions:', error);
            return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
        }

        // Log count for debugging
        console.log(`DEBUG: Found ${commissions?.length || 0} commissions for ${email}`);

        // Dynamically import getOfferById to avoid circular dependencies if any
        const { getOfferById } = await import('@/lib/db/offers');

        // Enrich commissions with extras array
        const enrichedCommissions = await Promise.all((commissions || []).map(async (c: CommissionData) => {
            const extras: string[] = [];
            const offers: OfferData[] = [];
            let hasFreeBackground = false;
            let hasFreeTimelapse = false;
            let hasFreeFraming = false;
            let hasFreeDelivery = false;

            if (c.promo_ids && Array.isArray(c.promo_ids)) {
                try {
                    for (const pid of c.promo_ids) {
                        const offer = await getOfferById(pid);
                        if (offer) {
                            offers.push(offer);
                            if (offer.free_extras?.background) hasFreeBackground = true;
                            if (offer.free_extras?.timelapse) hasFreeTimelapse = true;
                            if (offer.free_extras?.framing) hasFreeFraming = true;
                            if (offer.free_extras?.delivery) hasFreeDelivery = true;
                        }
                    }
                } catch {
                    // Ignore offer fetch errors
                }
            }

            if (c.detailed_background) {
                extras.push(`Detailed Background ${hasFreeBackground ? '(FREE)' : '(+₹500)'}`);
            }
            if (c.timelapse_recording) {
                extras.push(`Timelapse Recording ${hasFreeTimelapse ? '(FREE)' : '(+₹500)'}`);
            }
            if (c.framing) {
                // framing base price is variable based on size, but we can just say Framing or Framing (FREE)
                extras.push(`Framing ${hasFreeFraming ? '(FREE)' : ''}`);
            }
            if (hasFreeDelivery) {
                extras.push('Delivery (FREE)');
            }

            return {
                ...c,
                extras,
                discount_percents: offers.map(o => o.discount_percent || 0)
            };
        }));

        return NextResponse.json({ commissions: enrichedCommissions });

    } catch (error: unknown) {
        console.error('API Error fetching client commissions:', error);
        return NextResponse.json({ error: (error as Error).message || 'Server error' }, { status: 500 });
    }
}

