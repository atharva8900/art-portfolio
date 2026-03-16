/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { Adapter } from "next-auth/adapters";
import { supabaseAdmin } from "../supabase/admin";

/**
 * A lightweight custom NextAuth adapter that only handles verification tokens.
 * This allows us to use Magic Links without needing a full-blown session/user table system,
 * as we are using JWT-based manual session management for everything else.
 */
export function SupabaseVerificationAdapter(): Adapter {
    return {
        async createVerificationToken(verificationToken: any) {
            console.log('Creating verification token for:', verificationToken.identifier);
            const { data, error } = await supabaseAdmin
                .from('verification_tokens')
                .insert({
                    identifier: verificationToken.identifier,
                    token: verificationToken.token,
                    expires: verificationToken.expires
                })
                .select()
                .single();

            if (error) {
                console.error('Failed to create verification token:', error);
                throw error;
            }
            console.log('Verification token created successfully');
            return data;
        },

        async useVerificationToken({ identifier, token }: any) {
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
        async createUser(user: any) { return user },
        async getUser(id: string) { return null },
        async getUserByEmail(email: string) { return null },
        async getUserByAccount(params: any) { return null },
        async updateUser(user: any) { return user },
        async deleteUser(id: string) { },
        async linkAccount(account: any) { },
        async unlinkAccount(params: any) { },
        async createSession(session: any) { return session },
        async getSessionAndUser(token: string) { return null },
        async updateSession(session: any) { return session },
        async deleteSession(token: string) { },
    } as any;
}
