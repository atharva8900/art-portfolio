import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(request: NextRequest) {
    try {
        const { secret } = await request.json();

        if (!ADMIN_SECRET) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (secret === ADMIN_SECRET) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
        }
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
