require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
    try {
        const data = await resend.emails.send({
            from: 'Atharva Sherlekar Art <onboarding@resend.dev>',
            to: 'atharvajs8900@gmail.com',
            subject: 'Test Email from Resend API (JS)',
            html: '<p>This is a test email to verify Resend is working via JS script.</p>',
        });
        console.log('Success:', data);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

testEmail();
