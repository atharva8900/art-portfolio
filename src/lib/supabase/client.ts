import { createBrowserClient } from '@supabase/ssr'

// Singleton instance — prevents multiple clients competing for the auth lock
// which causes AbortError: signal is aborted without reason
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (!client) {
        // Force the use of the proxy bridge for all browser-side requests
        const isBrowser = typeof window !== 'undefined';
        const supabaseUrl = isBrowser
            ? window.location.origin + '/_supabase'
            : process.env.NEXT_PUBLIC_SUPABASE_URL!;

        client = createBrowserClient(
            supabaseUrl,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return client;
}
