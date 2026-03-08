import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CommissionData } from '@/lib/commissions';

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
        const { getOfferById } = await import('@/lib/offers');

        // Enrich commissions with extras array
        const enrichedCommissions = await Promise.all((commissions || []).map(async (c: CommissionData) => {
            const extras: string[] = [];
            let offer = null;

            if (c.promo_id) {
                try {
                    offer = await getOfferById(c.promo_id);
                } catch {
                    // Ignore offer fetch errors
                }
            }

            if (c.detailed_background) {
                extras.push(`Detailed Background ${offer?.free_extras?.background ? '(FREE)' : '(+₹500)'}`);
            }
            if (c.timelapse_recording) {
                extras.push(`Timelapse Recording ${offer?.free_extras?.timelapse ? '(FREE)' : '(+₹500)'}`);
            }
            if (c.framing) {
                // framing base price is variable based on size, but we can just say Framing or Framing (FREE)
                extras.push(`Framing ${offer?.free_extras?.framing ? '(FREE)' : ''}`);
            }
            if (offer?.free_extras?.delivery) {
                extras.push('Delivery (FREE)');
            }

            return {
                ...c,
                extras,
                discount_percent: offer?.discount_percent || 0
            };
        }));

        return NextResponse.json({ commissions: enrichedCommissions });

    } catch (error: unknown) {
        console.error('API Error fetching client commissions:', error);
        return NextResponse.json({ error: (error as Error).message || 'Server error' }, { status: 500 });
    }
}
