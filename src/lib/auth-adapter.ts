import { Adapter } from "next-auth/adapters";
import { supabaseAdmin } from "./supabase/admin";

/**
 * A lightweight custom NextAuth adapter that only handles verification tokens.
 * This allows us to use Magic Links without needing a full-blown session/user table system,
 * as we are using JWT-based manual session management for everything else.
 */
export function SupabaseVerificationAdapter(): Adapter {
    return {
        // @ts-ignore
        async createVerificationToken(verificationToken) {
            const { data, error } = await supabaseAdmin
                .from('verification_tokens')
                .insert({
                    identifier: verificationToken.identifier,
                    token: verificationToken.token,
                    expires: verificationToken.expires
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        // @ts-ignore
        async useVerificationToken({ identifier, token }) {
            const { data, error } = await supabaseAdmin
                .from('verification_tokens')
                .delete()
                .match({ identifier, token })
                .select()
                .single();

            if (error && error.code !== 'PGRST116') {
                // PGRST116 is "no rows returned", which is fine for verification
                throw error;
            }
            return data || null;
        },

        // We don't need these since we use JWT strategy and manual user checks
        async createUser(user) { return user as any },
        async getUser(id) { return null },
        async getUserByEmail(email) { return null },
        async getUserByAccount({ providerAccountId, provider }) { return null },
        async updateUser(user) { return user as any },
        async deleteUser(userId) { },
        async linkAccount(account) { },
        async unlinkAccount({ providerAccountId, provider }) { },
        async createSession(session) { return session },
        async getSessionAndUser(sessionToken) { return null },
        async updateSession(session) { return session },
        async deleteSession(sessionToken) { },
    };
}
