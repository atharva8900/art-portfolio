import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;

    if (code) {
        console.log('auth/callback: Processing code...');
        const supabase = createClient();

        try {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
                console.error('auth/callback: Code exchange error:', error);
                return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error.message)}`, origin));
            }
            console.log('auth/callback: Successfully exchanged code for session');
        } catch (err) {
            console.error('auth/callback: Unexpected error:', err);
            return NextResponse.redirect(new URL('/?auth_error=unexpected', origin));
        }
    }

    // Always redirect to home page, clearing the 'code' from URL
    return NextResponse.redirect(new URL('/', origin));
}
