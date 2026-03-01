import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, currency = 'INR', receipt } = body;

        if (!amount || !receipt) {
            return NextResponse.json({ error: 'Missing amount or receipt' }, { status: 400 });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency,
            receipt,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json(order);
    } catch (error: unknown) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to create order' },
            { status: 500 }
        );
    }
}
