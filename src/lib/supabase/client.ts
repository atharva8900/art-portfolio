import { createBrowserClient } from '@supabase/ssr'

// Singleton instance — prevents multiple clients competing for the auth lock
// which causes AbortError: signal is aborted without reason
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (!client) {
        client = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    fetch: async (url, options) => {
                        const urlStr = url.toString();
                        // Only proxy client-side requests to Supabase
                        if (typeof window !== 'undefined' && urlStr.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL!)) {
                            const proxiedUrl = urlStr.replace(
                                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                                window.location.origin + '/_supabase'
                            );
                            return fetch(proxiedUrl, options);
                        }
                        return fetch(url, options);
                    }
                }
            }
        );
    }
    return client;
}
