import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

import { checkAdminAuth } from '@/lib/auth/admin-auth';

const BUCKET = 'commission-wip';
const WIP_SLOTS = ['start', 'mid', 'finished'] as const;
type WipSlot = typeof WIP_SLOTS[number];

async function getAdminSession() {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return null;
    return await getServerSession(authOptions);
}

// POST /api/admin/commissions/[id]/wip  — upload a WIP image for a slot
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: commissionId } = await params;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const slot = formData.get('slot') as WipSlot | null;

    if (!file || !slot || !WIP_SLOTS.includes(slot)) {
        return NextResponse.json({ error: 'Missing file or invalid slot' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${commissionId}/${slot}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true, // overwrite if exists
        });

    if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    // Get current wip_images array
    const { data: commission, error: fetchError } = await supabaseAdmin
        .from('commissions')
        .select('wip_images')
        .eq('id', commissionId)
        .single();

    if (fetchError || !commission) {
        return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
    }

    // wip_images is stored as [start_url, mid_url, finished_url] — indexed by slot
    const currentImages: (string | null)[] = commission.wip_images ?? [null, null, null];
    while (currentImages.length < 3) currentImages.push(null);
    const slotIndex = WIP_SLOTS.indexOf(slot);
    currentImages[slotIndex] = publicUrl;

    const { error: updateError } = await supabaseAdmin
        .from('commissions')
        .update({ wip_images: currentImages.filter(Boolean) as string[] })
        .eq('id', commissionId);

    if (updateError) {
        return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl, slot });
}

// DELETE /api/admin/commissions/[id]/wip?slot=start  — remove a WIP image
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: commissionId } = await params;
    const slot = req.nextUrl.searchParams.get('slot') as WipSlot | null;

    if (!slot || !WIP_SLOTS.includes(slot)) {
        return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
    }

    // Get current wip_images
    const { data: commission, error: fetchError } = await supabaseAdmin
        .from('commissions')
        .select('wip_images')
        .eq('id', commissionId)
        .single();

    if (fetchError || !commission) {
        return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
    }

    const slotIndex = WIP_SLOTS.indexOf(slot);
    const currentImages: (string | null)[] = commission.wip_images ?? [null, null, null];
    while (currentImages.length < 3) currentImages.push(null);
    currentImages[slotIndex] = null;

    // Try to delete from storage (best-effort)
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    for (const ext of extensions) {
        await supabaseAdmin.storage.from(BUCKET).remove([`${commissionId}/${slot}.${ext}`]);
    }

    const { error: updateError } = await supabaseAdmin
        .from('commissions')
        .update({ wip_images: currentImages.filter(Boolean) as string[] })
        .eq('id', commissionId);

    if (updateError) {
        return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
