import { NextRequest, NextResponse } from 'next/server';
import { getAvailability, setAvailability } from '@/lib/availability';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ALLOWED_EMAILS = ['atharva8900@gmail.com', 'atharvasherlekarart@gmail.com'];

async function checkAdminAuth() {
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
        return false;
    }

    return ALLOWED_EMAILS.includes(user.email);
}

// GET: Returns the current commission availability
export async function GET() {
    try {
        const data = await getAvailability();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching availability:', error);
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }
}

// POST: Updates the commission availability (Requires Admin Auth)
export async function POST(request: NextRequest) {
    try {
        const isAdmin = await checkAdminAuth();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
        }

        const body = await request.json();
        const { isOpen } = body;

        if (typeof isOpen !== 'boolean') {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // Update Status
        const newData = await setAvailability(isOpen);

        return NextResponse.json({
            success: true,
            status: newData.is_accepting_commissions ? 'OPEN' : 'CLOSED',
            updated: newData.last_updated
        });

    } catch (error) {
        console.error('Error updating availability:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
