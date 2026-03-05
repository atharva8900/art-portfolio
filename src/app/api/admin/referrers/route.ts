import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getAllReferrals } from '@/lib/referrals';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com'];

async function checkAdminAuth() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return false;
    }

    return ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
}

export async function GET(request: NextRequest) {
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
