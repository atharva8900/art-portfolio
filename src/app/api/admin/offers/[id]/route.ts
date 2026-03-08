import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { deleteOffer } from '@/lib/offers';

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com'];

async function checkAdminAuth() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) return false;
    return ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
}

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
