export type ArtworkCategory = 'fan_art' | 'religious' | 'personal';

export interface Artwork {
    id: string;
    title: string;
    category: ArtworkCategory;
    image_url: string;
    created_at: string;
}

export interface Availability {
    id: number;
    is_accepting_commissions: boolean;
}

export interface Commission {
    id: string;
    name: string;
    email: string;
    phone?: string;
    instagram_id?: string;
    size: string;
    number_of_people: number;
    background_detail?: string;
    address: string;
    notes?: string;
    status: 'pending' | 'accepted' | 'completed';
    referral_code?: string;
    created_at: string;
}

export interface Referral {
    code: string;
    referrer_name: string;
    referrer_email: string;
    referrer_contact: string;
    is_used: boolean;
    created_at: string;
}
