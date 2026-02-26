import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getActiveCommissionStatus } from '@/lib/commissions';

export async function GET() {
    try {
        const cookieStore = cookies();
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

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || !user.email) {
            return NextResponse.json({ active: false, status: null }); // Not logged in or no email
        }

        const status = await getActiveCommissionStatus(user.email);
        const active = status !== null;

        return NextResponse.json({ active, status });
    } catch (err) {
        console.error('Check Active Commission Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
