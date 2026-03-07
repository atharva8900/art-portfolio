import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { SupabaseVerificationAdapter } from "./auth-adapter"

export const authOptions: NextAuthOptions = {
    adapter: SupabaseVerificationAdapter(),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: Number(process.env.EMAIL_SERVER_PORT),
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD,
                },
            },
            from: process.env.EMAIL_FROM,
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
