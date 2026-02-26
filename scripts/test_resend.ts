import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
    try {
        const data = await resend.emails.send({
            from: 'Atharva Sherlekar Art <onboarding@resend.dev>',
            to: 'atharvajs8900@gmail.com', // Replace with user's actual email for testing if known, or a dummy
            subject: 'Test Email from Resend API',
            html: '<p>This is a test email to verify Resend is working.</p>',
        });
        console.log('Success:', data);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

testEmail();
