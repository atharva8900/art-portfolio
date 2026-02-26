import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const ADMIN_SECRET = process.env.ADMIN_SECRET;
// Normalize emails to lowercase for comparison
const ALLOWED_EMAILS = [
    'atharva.sherlekar@gmail.com',
    'atharva8900@gmail.com',
    'atharvasherlekarart@gmail.com',
    'atharvasherlekar@gmail.com',
    process.env.NEXT_PUBLIC_ARTIST_EMAIL
]
    .filter(Boolean)
    .map(email => email?.toLowerCase());

export async function POST() {
    try {
        if (!ADMIN_SECRET) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (ALLOWED_EMAILS.includes(session.user.email.toLowerCase())) {
            return NextResponse.json({ success: true, secret: ADMIN_SECRET });
        } else {
            return NextResponse.json({ error: 'Unauthorized email' }, { status: 403 });
        }
    } catch (error) {
        console.error('Session verification error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
