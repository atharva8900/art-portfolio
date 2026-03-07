/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET() {
    console.log('--- Email Diagnostic Start ---');
    console.log('Host:', process.env.EMAIL_SERVER_HOST);
    console.log('User:', process.env.EMAIL_SERVER_USER);
    console.log('Has Password:', !!process.env.EMAIL_SERVER_PASSWORD);

    try {
        const { data, error } = await sendEmail({
            to: process.env.EMAIL_SERVER_USER || 'test@example.com',
            subject: 'Diagnostic Email Test',
            html: '<h1>Email System Working</h1><p>This is a test from the diagnostic route.</p>'
        });

        if (error) {
            console.error('Diagnostic Email Error:', error);
            return NextResponse.json({
                success: false,
                error: error instanceof Error ? error.message : String(error),
                details: error
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully via Nodemailer.',
            info: data
        });
    } catch (err: any) {
        console.error('Diagnostic Route Crash:', err);
        return NextResponse.json({
            success: false,
            error: err.message,
            stack: err.stack
        }, { status: 500 });
    }
}
