import { NextResponse } from 'next/server';

import { deleteOffer } from '@/lib/db/offers';

import { checkAdminAuth } from '@/lib/auth/admin-auth';

// Auth check centralized

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        if (!await checkAdminAuth()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const id = params.id;
        const success = await deleteOffer(id);
        if (!success) {
            return NextResponse.json({ error: 'Failed to delete offer' }, { status: 400 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in admin offers DELETE:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
