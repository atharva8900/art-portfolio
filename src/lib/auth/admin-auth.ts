import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth/auth';

import { ADMIN_EMAILS } from '@/lib/config/constants';

export const ALLOWED_ADMIN_EMAILS = ADMIN_EMAILS.map((email: string) => email.toLowerCase());

export async function checkAdminAuth() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        return false;
    }

    return ALLOWED_ADMIN_EMAILS.includes(session.user.email.toLowerCase());
}

