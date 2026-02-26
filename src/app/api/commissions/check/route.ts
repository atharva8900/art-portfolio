import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveCommissionStatus } from '@/lib/commissions';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user;

        if (!user || !user.email) {
            return NextResponse.json({ active: false, status: null }); // Not logged in or no email
        }

        const status = await getActiveCommissionStatus(user.email);
        const active = status !== null;

        return NextResponse.json({ active, status });
    } catch (err) {
        console.error('Check Active Commission Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
