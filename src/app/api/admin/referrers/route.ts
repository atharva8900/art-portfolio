import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getAllReferrals } from '@/lib/db/referrals';


import { checkAdminAuth } from '@/lib/auth/admin-auth';

// Auth check centralized

export async function GET() {
    try {
        const isAdmin = await checkAdminAuth();

        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const referrers = await getAllReferrals();

        return NextResponse.json({ referrers });
    } catch (error) {
        console.error('Error in referrers API route:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

