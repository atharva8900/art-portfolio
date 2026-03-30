import { NextResponse } from 'next/server';
import { getPublicOffer } from '@/lib/db/offers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const countryParam = searchParams.get('country');
        const country = countryParam || req.headers.get('x-vercel-ip-country') || 'IN'; // priority: param > header > default
        let offer = await getPublicOffer();

        if (offer && country !== 'IN' && offer.only_india_delivery) {
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

        return NextResponse.json({ offer }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error) {
        console.error('Error in public offer API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
