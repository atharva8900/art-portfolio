import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const mockArtworks = [
        {
            id: '1',
            title: 'Andrew Spider-Man',
            category: 'fan_art',
            image_url: '/images/spiderman_andrew_final.jpg',
            reference_image_url: '/images/spiderman_andrew_ref.jpg',
            time_invested: '80+ hours',
            size: 'A3 (38 × 28 cm)',
            created_at: new Date().toISOString()
        },
        {
            id: '2',
            title: 'Mr Bean Portrait',
            category: 'fan_art',
            image_url: '/images/mr_bean_final.jpg',
            reference_image_url: '/images/mr_bean_ref.jpg',
            time_invested: '45+ hours',
            size: 'A3 (40 × 28 cm)',
            created_at: new Date().toISOString()
        },
        {
            id: '3',
            title: 'Tobey Portrait',
            category: 'fan_art',
            image_url: '/images/spiderman_tobey_final.jpg',
            reference_image_url: '/images/spiderman_tobey_ref.jpg',
            time_invested: '18+ hours',
            size: 'A4 (30 × 18 cm)',
            created_at: new Date().toISOString()
        }
    ];

    return NextResponse.json(mockArtworks);
}
