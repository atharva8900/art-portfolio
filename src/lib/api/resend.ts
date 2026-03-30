import { Resend } from 'resend';

// Lazy instantiation to avoid build errors if the API key is missing
let resendInstance: Resend | null = null;

function getResend() {
    if (!resendInstance) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            // During build time, if the key is missing, we shouldn't crash.
            // In runtime, this will be caught when trying to send an email.
            console.warn('RESEND_API_KEY is not defined. Email sending will fail.');
            return null;
        }
        resendInstance = new Resend(apiKey);
    }
    return resendInstance;
}


interface SendResendEmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

export async function sendResendEmail({ to, subject, html, from }: SendResendEmailOptions) {
    const fromName = "Atharva Sherlekar Art";
    // Default to auth@atharvasart.in if no from address is provided
    const defaultFrom = `"${fromName}" <auth@atharvasart.in>`;
    const sender = from || process.env.AUTH_EMAIL_FROM || defaultFrom;

    const resend = getResend();
    if (!resend) {
        return { data: null, error: { name: 'ConfigurationError', message: 'RESEND_API_KEY is missing' } };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: sender,
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Resend Error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Resend Exception:', error);
        return { data: null, error };
    }
}
