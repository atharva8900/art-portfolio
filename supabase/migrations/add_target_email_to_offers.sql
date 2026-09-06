-- Add target_email column to offers table for client-restricted promo codes
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS target_email TEXT;
