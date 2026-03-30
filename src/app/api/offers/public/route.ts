import { NextResponse } from 'next/server';
import { getPublicOffer } from '@/lib/db/offers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const offer = await getPublicOffer();
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
