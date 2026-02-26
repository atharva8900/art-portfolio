'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthHandlerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        const code = searchParams.get('code');

        if (code) {
            const handleAuthCode = async () => {
                try {
                    // Exchange the code for a session
                    const { error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error) {
                        console.error('Auth code exchange failed:', error.message);
                    } else {
                        console.log('Successfully exchanged code for session');
                    }
                } catch (err) {
                    console.error('Auth error:', err);
                } finally {
                    // Clean up the URL by removing the code parameter
                    // This prevents re-exchanging the same code on refresh
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('code');
                    const newPath = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
                    router.replace(newPath);
                }
            };

            handleAuthCode();
        }
    }, [searchParams, supabase.auth, router]);

    return null;
}

export default function AuthHandler() {
    return (
        <Suspense fallback={null}>
            <AuthHandlerContent />
        </Suspense>
    );
}
