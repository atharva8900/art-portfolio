-- 1. CLEANUP: Drop existing tables to avoid schema conflicts
-- CASCADE ensures dependent tables (like commissions referencing referrals) are also handled
DROP TABLE IF EXISTS public.commissions;
DROP TABLE IF EXISTS public.referrals CASCADE;

-- 2. REFERRALS TABLE: Full feature parity with ReferralData type
CREATE TABLE public.referrals (
    code TEXT PRIMARY KEY,
    referrer_email TEXT NOT NULL,
    referrer_name TEXT NOT NULL,
    referrer_phone TEXT,
    referrer_instagram TEXT,
    referrer_user_id UUID, -- For linking to authenticated users if needed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_hash TEXT,
    successful_referrals_count INT DEFAULT 0,
    used_by_emails TEXT[] DEFAULT '{}',
    ip_submissions JSONB DEFAULT '[]'::jsonb
);

-- 3. COMMISSIONS TABLE: Full feature parity with CommissionData type
CREATE TABLE public.commissions (
    id TEXT PRIMARY KEY, -- The application generates IDs like COM_...
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    phone TEXT,
    instagram_id TEXT,
    size TEXT NOT NULL,
    number_of_people TEXT NOT NULL,
    detailed_background BOOLEAN DEFAULT FALSE,
    timelapse_recording BOOLEAN DEFAULT FALSE,
    framing BOOLEAN DEFAULT FALSE,
    consent BOOLEAN DEFAULT FALSE,
    address TEXT NOT NULL,
    referral_code TEXT REFERENCES public.referrals(code),
    referrer_info JSONB, -- Stores nested referrer metadata
    status TEXT CHECK (status IN ('pending', 'accepted', 'in_progress', 'on_delivery', 'completed', 'rejected', 'waitlist')) DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    admin_note TEXT,
    payout_status TEXT CHECK (payout_status IN ('unpaid', 'requested', 'paid')) DEFAULT 'unpaid',
    needed_by TEXT,
    base_price NUMERIC,
    extras_total NUMERIC,
    commission_amount NUMERIC,
    frame_image TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    payment_status TEXT DEFAULT 'pending',
    is_self_referral_flag BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    promo_id TEXT,
    promotion_code TEXT
);

-- 4. SECURITY (RLS)
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Allow the public form to submit commissions
CREATE POLICY "Public can submit commissions" 
ON public.commissions FOR INSERT 
WITH CHECK (true);

-- Allow the public form to check if a referral code exists
CREATE POLICY "Public can view referral codes" 
ON public.referrals FOR SELECT 
USING (true);

-- Note: Admin access (select/update/delete) should be handled via 
-- SUPABASE_SERVICE_ROLE_KEY on the server to bypass RLS safely.

-- 5. SEED DATA (If needed for testing availability)
-- Availability table should already exist from prev schema, let's ensure it's correct
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'availability') THEN
        CREATE TABLE public.availability (
            id INT PRIMARY KEY DEFAULT 1,
            is_accepting_commissions BOOLEAN DEFAULT TRUE,
            last_updated TIMESTAMPTZ DEFAULT NOW()
        );
        INSERT INTO public.availability (id, is_accepting_commissions) VALUES (1, TRUE);
    END IF;
END $$;
