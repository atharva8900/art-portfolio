import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Check if we are using placeholder env vars
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
        const mockArtworks = [
            { id: '1', title: 'Hyper-realistic Eye', category: 'personal', image_url: 'https://images.unsplash.com/photo-1594132847051-7f093159dc70?q=80&w=600&auto=format&fit=crop', created_at: new Date().toISOString() },
            { id: '2', title: 'Graphite Portrait', category: 'personal', image_url: 'https://images.unsplash.com/photo-1594132846990-25e62f520780?q=80&w=600&auto=format&fit=crop', created_at: new Date().toISOString() },
            { id: '3', title: 'Detailed Texture', category: 'fan_art', image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop', created_at: new Date().toISOString() },
        ];
        return NextResponse.json(mockArtworks);
    }

    const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase Error:', error);
        // Return empty array instead of error to avoid breaking UI completely
        return NextResponse.json([]);
    }

    return NextResponse.json(data);
}
