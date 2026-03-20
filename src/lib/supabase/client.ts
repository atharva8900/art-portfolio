import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * CLAUDE'S IMPROVED SINGLETON FIX:
 * 1. Hard-fails on the server to prevent accidental browser-client creation during SSR.
 * 2. Uses a stable versioned key in globalThis that survives HMR and StrictMode double-invokes.
 * 3. Explicitly sets a storageKey to keep GoTrue's internal registry happy.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const GLOBAL_KEY = '__supabase_browser_client_v1'

declare global {
  // eslint-disable-next-line no-var
  var __supabase_browser_client_v1: SupabaseClient | undefined
}

export function getSupabaseClient(): SupabaseClient {
    // Server-side guard: Browser clients belong only on the client.
    // Use createServerClient from @supabase/ssr in Server Components/Actions.
    if (typeof window === 'undefined') {
        throw new Error(
            'getSupabaseClient() was called on the server. This is a browser-only client. ' +
            'Please use createServerClient() from "@/lib/supabase/server" for server-side operations.'
        );
    }

    // Check both local module cache AND globalThis for maximum stability
    if (!globalThis[GLOBAL_KEY]) {
        console.log('[Supabase] Creating global browser client instance...');
        globalThis[GLOBAL_KEY] = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                detectSessionInUrl: true,
                storageKey: 'sb-app-auth-token', // Explicit stable key
            },
        });
    }

    return globalThis[GLOBAL_KEY]!;
}

/**
 * Lazy Proxy export. 
 * This allows us to import { supabase } anywhere without worrying about 
 * it being initialized too early or on the server (until a property is accessed).
 */
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        const client = getSupabaseClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val = (client as any)[prop];
        return typeof val === 'function' ? val.bind(client) : val;
    },
});

/**
 * For backward compatibility with existing components.
 */
export function createClient() {
    return getSupabaseClient();
}
