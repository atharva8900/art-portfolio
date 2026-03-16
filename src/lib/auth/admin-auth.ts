import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth/auth';

export const ALLOWED_ADMIN_EMAILS = [
    'atharva8900@gmail.com',
    'atharvasherlekarart@gmail.com',
].map(email => email.toLowerCase());

export async function checkAdminAuth() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return false;
    }

    return ALLOWED_ADMIN_EMAILS.includes(session.user.email.toLowerCase());
}

