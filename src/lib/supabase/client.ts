import { createBrowserClient } from '@supabase/ssr'

// Singleton instance — prevents multiple clients competing for the auth lock
// which causes AbortError: signal is aborted without reason
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (!client) {
        client = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return client;
}
