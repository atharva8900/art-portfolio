export type ArtworkCategory = 'fan_art' | 'religious' | 'personal';

export interface Artwork {
    id: string;
    title: string;
    category: ArtworkCategory;
    image_url: string;
    reference_image_url?: string;
    time_invested?: string;
    size?: string;
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
    detailed_background?: boolean;
    timelapse_recording?: boolean;
    address: string;
    notes?: string;
    status: 'pending' | 'accepted' | 'in_progress' | 'on_delivery' | 'completed' | 'rejected' | 'waitlist';
    referral_code?: string;
    created_at: string;
    // Commission Calculation Fields
    base_price?: number;        // Price derived from size * people
    extras_total?: number;      // Framing + Delivery + Add-ons (Excluded from commission)
    commission_amount?: number; // 20% of base_price (For Referrer)
}

export interface Referral {
    code: string;
    referrer_name: string;
    referrer_email: string;
    referrer_phone?: string;
    referrer_instagram?: string;
    referrer_user_id?: string;
    created_at: string;
    ip_hash: string;
    successful_referrals_count: number;
    used_by_emails: string[];
    ip_submissions: string[]; // Store hashed IP addresses to prevent spam
}
