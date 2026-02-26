import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET() {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const data = await resend.emails.send({
            from: 'Atharva Sherlekar Art <onboarding@resend.dev>',
            to: 'atharvajs8900@gmail.com', // Developer's email
            subject: 'Test Email Triggered via NextJS API',
            html: '<p>This confirms Resend works inside Next.js API route.</p>',
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) });
    }
}
