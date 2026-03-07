import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET() {
    try {
        const { data, error } = await sendEmail({
            to: 'atharvajs8900@gmail.com', // Developer's email
            subject: 'Test Email Triggered via NextJS API (Gmail SMTP)',
            html: '<p>This confirms Gmail SMTP works for client automation!</p>',
        });
        return NextResponse.json({ success: true, data, error });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) });
    }
}
