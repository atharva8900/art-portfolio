import { NextResponse } from 'next/server';

import { checkAdminAuth } from '@/lib/admin-auth';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST() {
    try {
        if (!ADMIN_SECRET) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const isAdmin = await checkAdminAuth();

        if (isAdmin) {
            return NextResponse.json({ success: true, secret: ADMIN_SECRET });
        } else {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
    } catch (error) {
        console.error('Session verification error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
