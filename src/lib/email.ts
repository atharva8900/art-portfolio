import nodemailer from 'nodemailer';

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: any[];
    bcc?: string;
}

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

export async function sendEmail({ to, subject, html, attachments, bcc }: SendEmailOptions) {
    const fromName = "Atharva Sherlekar Art";
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER;

    try {
        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html,
            attachments: attachments?.map(att => ({
                filename: att.filename,
                content: att.content,
                encoding: 'base64'
            })),
            bcc,
        });
        return { data: info, error: null };
    } catch (error) {
        console.error('Nodemailer Error:', error);
        return { data: null, error };
    }
}
