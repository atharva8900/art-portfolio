import { createServerClient, type CookieOptions } from '@supabase/ssr'

export function createClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                get(name: string) { return undefined },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                set(name: string, value: string, options: CookieOptions) {},
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                remove(name: string, options: CookieOptions) {},
            },
        }
    )
}
