import { supabaseAdmin } from './supabase/admin';

export interface OfferData {
    id: string;
    code: string;
    name: string;
    discount_percent: number;
    usage_limit: number;
    usage_count: number;
    click_count: number;
    expires_at: string | null;
    free_extras: {
        delivery?: boolean;
        timelapse?: boolean;
        background?: boolean;
        framing?: boolean;
    };
    is_active: boolean;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export async function getAllOffers(): Promise<OfferData[]> {
    const { data, error } = await supabaseAdmin
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error reading offers from Supabase:', error);
        return [];
    }

    return (data || []) as OfferData[];
}

export async function createOffer(offer: Partial<OfferData>): Promise<OfferData | null> {
    const { data, error } = await supabaseAdmin
        .from('offers')
        .insert([offer])
        .select()
        .single();

    if (error) {
        console.error('Error creating offer in Supabase:', error);
        return null;
    }

    return data as OfferData;
}

export async function deleteOffer(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('offers')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting offer from Supabase:', error);
        return false;
    }

    return true;
}

export async function getOfferByCode(code: string): Promise<OfferData | null> {
    const { data, error } = await supabaseAdmin
        .from('offers')
        .select('*')
        .eq('code', code.toUpperCase())
        .maybeSingle();

    if (error) {
        console.error('Error getting offer by code:', error);
        return null;
    }

    return data as OfferData;
}

export async function validateOffer(code: string): Promise<{ valid: boolean; offer?: OfferData; error?: string }> {
    const offer = await getOfferByCode(code);

    if (!offer) {
        return { valid: false, error: 'Invalid offer code.' };
    }

    if (!offer.is_active) {
        return { valid: false, error: 'This offer is no longer active.' };
    }

    if (offer.usage_count >= offer.usage_limit) {
        return { valid: false, error: 'This exclusive offer has reached its limit.' };
    }

    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
        return { valid: false, error: 'This offer has expired.' };
    }

    return { valid: true, offer };
}

export async function incrementOfferClick(id: string): Promise<void> {
    const { error } = await supabaseAdmin.rpc('increment_offer_click', { offer_id: id });

    if (error) {
        // Fallback if RPC doesn't exist yet
        const { data: current } = await supabaseAdmin.from('offers').select('click_count').eq('id', id).single();
        if (current) {
            await supabaseAdmin.from('offers').update({ click_count: current.click_count + 1 }).eq('id', id);
        }
    }
}

export async function getOfferById(id: string): Promise<OfferData | null> {
    const { data, error } = await supabaseAdmin
        .from('offers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error('Error getting offer by id:', error);
        return null;
    }

    return data as OfferData;
}

export async function incrementOfferUsage(id: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin.rpc('increment_offer_usage', { offer_id: id });
    if (error) {
        console.error('Error incrementing offer usage:', error);
        return false;
    }
    return data as boolean;
}

export async function decrementOfferUsage(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin.rpc('decrement_offer_usage', { offer_id: id });
    if (error) {
        console.error('Error decrementing offer usage:', error);
        return false;
    }
    return true;
}
