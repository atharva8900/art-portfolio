import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { deleteReferral } from '@/lib/referrals';

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com'];

async function checkAdminAuth() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return false;
    }
    return ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
}

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
