-- Migration: Add detailed_clothes column to commissions table
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS detailed_clothes BOOLEAN DEFAULT FALSE;
