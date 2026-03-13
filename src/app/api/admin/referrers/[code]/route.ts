import { NextRequest, NextResponse } from 'next/server';

import { deleteReferral } from '@/lib/referrals';

import { checkAdminAuth } from '@/lib/admin-auth';

// Auth check centralized

export async function DELETE(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const success = await deleteReferral(params.code);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to delete affiliate' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in delete affiliate route:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
