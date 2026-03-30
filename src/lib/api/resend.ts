import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
