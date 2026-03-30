import { NextResponse } from 'next/server';
import { validateOffer, incrementOfferClick } from '@/lib/db/offers';
import { checkAndUpdateOfferLimit } from '@/lib/db/rate-limits';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const code = body.code;
        const fingerprint = body.fingerprint;

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        if (!fingerprint) {
            return NextResponse.json(
                { error: "Security check failed. Please refresh the page and try again." },
                { status: 400 }
            );
        }

        const { allowed } = await checkAndUpdateOfferLimit(fingerprint);
        
        if (!allowed) {
            return NextResponse.json(
                { valid: false, error: 'Too many invalid attempts. Please try again tomorrow.' },
                { status: 429 } 
            );
        }

        const result = await validateOffer(code);

        if (result.valid && result.offer) {
            const { searchParams } = new URL(req.url);
            const countryParam = searchParams.get('country');
            const country = countryParam || req.headers.get('x-vercel-ip-country') || 'IN'; // priority: param > header > default
            let offer = result.offer;
            
            if (country !== 'IN' && offer.only_india_delivery) {
                // Apply restriction: copy and update
                offer = {
                    ...offer,
                    free_extras: {
                        ...offer.free_extras,
                        delivery: false
                    },
                    delivery_restricted: true
                };
            }

            // Track click successfully validated
            await incrementOfferClick(offer.id);
            return NextResponse.json({ valid: true, offer });
        } else {
            return NextResponse.json({ valid: false, error: result.error }, { status: 200 });
        }
    } catch (error) {
        console.error('Error in offer validation API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

