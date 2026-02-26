import { createBrowserClient } from '@supabase/ssr'

// Singleton instance — prevents multiple clients competing for the auth lock
// which causes AbortError: signal is aborted without reason
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (!client) {
        // Use the internal rewrite path to bypass Jio DNS blocks
        // During build/SSR, window is undefined, so we fall back to the direct URL
        const supabaseUrl = typeof window !== 'undefined'
            ? window.location.origin + '/_supabase'
            : process.env.NEXT_PUBLIC_SUPABASE_URL!;

        client = createBrowserClient(
            supabaseUrl,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return client;
}
