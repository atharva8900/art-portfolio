import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = session.user.email.toLowerCase().trim();
        console.log('DEBUG: Fetching dashboard commissions for email:', email);

        // Fetch commissions matching the user's email (case-insensitive and trimmed)
        const { data: commissions, error } = await supabaseAdmin
            .from('commissions')
            .select('*')
            .ilike('client_email', email)
            .order('submitted_at', { ascending: false });

        if (error) {
            console.error('Error fetching client commissions:', error);
            return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
        }

        // Log count for debugging
        console.log(`DEBUG: Found ${commissions?.length || 0} commissions for ${email}`);

        return NextResponse.json({ commissions: commissions || [] });

    } catch (error: unknown) {
        console.error('API Error fetching client commissions:', error);
        return NextResponse.json({ error: (error as Error).message || 'Server error' }, { status: 500 });
    }
}
