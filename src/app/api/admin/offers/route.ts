import { NextResponse } from 'next/server';

import { getAllOffers, createOffer } from '@/lib/offers';

export const dynamic = 'force-dynamic';

import { checkAdminAuth } from '@/lib/admin-auth';

// Auth check centralized

export async function GET() {
    try {
        if (!await checkAdminAuth()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const offers = await getAllOffers();
        return NextResponse.json({ offers });
    } catch (error) {
        console.error('Error in admin offers GET:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        if (!await checkAdminAuth()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await req.json();
        const offer = await createOffer(body);
        if (!offer) {
            return NextResponse.json({ error: 'Failed to create offer' }, { status: 400 });
        }
        return NextResponse.json({ offer });
    } catch (error) {
        console.error('Error in admin offers POST:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
