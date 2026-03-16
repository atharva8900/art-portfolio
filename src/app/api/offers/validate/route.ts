import { NextResponse } from 'next/server';
import { validateOffer, incrementOfferClick } from '@/lib/db/offers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const result = await validateOffer(code);

        if (result.valid && result.offer) {
            // Track click successfully validated
            await incrementOfferClick(result.offer.id);
            return NextResponse.json({ valid: true, offer: result.offer });
        } else {
            return NextResponse.json({ valid: false, error: result.error }, { status: 200 });
        }
    } catch (error) {
        console.error('Error in offer validation API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

