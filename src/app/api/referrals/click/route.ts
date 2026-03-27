import { NextRequest, NextResponse } from 'next/server';
import { incrementClickCount } from '@/lib/db/referrals';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
        }

        // Increment the click count in Supabase
        await incrementClickCount(code);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Click Tracking Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
