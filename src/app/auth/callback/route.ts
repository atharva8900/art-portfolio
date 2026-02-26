import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: Record<string, unknown>) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: Record<string, unknown>) {
                        cookieStore.set({ name, value: '', ...options });
                    },
                },
            }
        );

        try {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
                console.error('Code exchange error:', error);
                // Redirect to an error page or back home with error
                return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
            }
        } catch (err) {
            console.error('Unexpected callback error:', err);
            return NextResponse.redirect(new URL('/?error=unexpected_error', requestUrl.origin));
        }
    }

    // Redirect to home page
    // Using current request origin ensures the user stays on their own site
    return NextResponse.redirect(new URL('/', requestUrl.origin));
}
