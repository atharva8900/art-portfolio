'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthHandlerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [status, setStatus] = useState<string>('');

    useEffect(() => {
        const code = searchParams.get('code');

        if (code) {
            const handleAuthCode = async () => {
                setStatus('Initializing...');

                // wait 1.5 seconds to let server-side callback finish
                await new Promise(resolve => setTimeout(resolve, 1500));

                try {
                    console.log('AuthHandler: Checking for existing session...');
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                        console.log('AuthHandler: Session found, login successful (handled by server)');
                        setStatus('Success! Redirecting...');
                        window.location.href = '/';
                        return;
                    }

                    setStatus('Finalizing login...');
                    console.log('AuthHandler: No session found, exchanging code...');
                    const { error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error) {
                        console.warn('AuthHandler: Exchange failed, last check...', error.message);

                        // Final check for session (maybe error was just a race condition)
                        const { data: { user: lastUser } } = await supabase.auth.getUser();
                        if (lastUser) {
                            window.location.href = '/';
                            return;
                        }

                        console.error('Auth code exchange failed:', error.message);
                        setStatus(`Error: ${error.message}`);
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    } else {
                        console.log('Successfully exchanged code for session');
                        setStatus('Success! Redirecting...');
                        window.location.href = '/';
                        return;
                    }
                } catch (err) {
                    console.error('Auth error:', err);
                    setStatus(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                } finally {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('code');
                    const newPath = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
                    router.replace(newPath);
                }
            };

            handleAuthCode();
        }
    }, [searchParams, supabase.auth, router]);

    if (!status) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-surface border border-accent/20 p-4 rounded-lg shadow-2xl max-w-xs animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${status.includes('Error') ? 'bg-red-500' : 'bg-accent animate-pulse'}`} />
                <p className="text-sm font-medium text-foreground">{status}</p>
            </div>
        </div>
    );
}

export default function AuthHandler() {
    return (
        <Suspense fallback={null}>
            <AuthHandlerContent />
        </Suspense>
    );
}
