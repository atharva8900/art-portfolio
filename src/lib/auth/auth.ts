import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { SupabaseVerificationAdapter } from '@/lib/auth/auth-adapter';
import { sendResendEmail } from '@/lib/api/resend';

export const authOptions: NextAuthOptions = {
    adapter: SupabaseVerificationAdapter(),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        EmailProvider({
            maxAge: 10 * 60, // 10 minutes
            async sendVerificationRequest({ identifier: to, url }) {
                console.log('Attempting to send magic link via Resend to:', to);
                try {
                    const { error } = await sendResendEmail({
                        to,
                        subject: 'Sign in to Atharva Sherlekar Art',
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1a1a1a; background-color: #000; color: #fff; border-radius: 12px;">
                                <h1 style="color: #fff; text-align: center;">Authorized Portal</h1>
                                <p style="color: #a3a3a3; font-size: 16px; line-height: 1.5;">Click the button below to sign in to your accounts. This link will expire in 10 minutes.</p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${url}" style="background-color: #fff; color: #000; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Sign In Now</a>
                                </div>
                                <p style="color: #525252; font-size: 12px; text-align: center;">If you didn't request this email, you can safely ignore it.</p>
                            </div>
                        `,
                    });

                    if (error) {
                        console.error('Magic Link Email Error (Resend):', error);
                        throw new Error(`EMAIL_SEND_FAILURE: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                    console.log('Magic link sent successfully via Resend');
                } catch (err) {
                    console.error('sendVerificationRequest crashed:', err);
                    throw err;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: '/login',
        error: '/login',
        verifyRequest: '/login?verify=true',
    },
    callbacks: {
        async session({ session }) {
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}
