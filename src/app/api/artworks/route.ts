import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const mockArtworks = [
        {
            id: '1',
            title: 'Andrew Spider-Man',
            category: 'fan_art',
            image_url: 'https://github.com/atharva8900/art-portfolio/blob/main/WhatsApp%20Image%202026-02-11%20at%203.41.04%20PM%20(1).jpeg?raw=true',
            reference_image_url: 'https://github.com/atharva8900/art-portfolio/blob/main/WhatsApp%20Image%202026-02-17%20at%203.22.39%20PM.jpeg?raw=true',
            time_invested: '80+ hours',
            size: 'A3 (38 × 28 cm)',
            created_at: new Date().toISOString()
        },
        {
            id: '2',
            title: 'Mr Bean Portrait',
            category: 'fan_art',
            image_url: 'https://github.com/atharva8900/art-portfolio/blob/main/WhatsApp%20Image%202026-02-11%20at%203.41.04%20PM.jpeg?raw=true',
            reference_image_url: 'https://github.com/atharva8900/art-portfolio/blob/main/mr%20bean.jpeg?raw=true',
            time_invested: '45+ hours',
            size: 'A3 (40 × 28 cm)',
            created_at: new Date().toISOString()
        },
        {
            id: '3',
            title: 'Tobey Portrait',
            category: 'fan_art',
            image_url: 'https://github.com/atharva8900/art-portfolio/blob/main/WhatsApp%20Image%202026-02-11%20at%203.41.02%20PM%20(1).jpeg?raw=true',
            reference_image_url: 'https://github.com/atharva8900/art-portfolio/blob/main/tobey.jpeg?raw=true',
            time_invested: '18+ hours',
            size: 'A4 (30 × 18 cm)',
            created_at: new Date().toISOString()
        }
    ];

    return NextResponse.json(mockArtworks);
}
