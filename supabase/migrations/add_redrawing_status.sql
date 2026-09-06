-- Add 'redrawing' to commissions status check constraint
ALTER TABLE public.commissions DROP CONSTRAINT IF EXISTS commissions_status_check;
ALTER TABLE public.commissions ADD CONSTRAINT commissions_status_check CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'in_progress'::text, 'redrawing'::text, 'finished'::text, 'on_delivery'::text, 'completed'::text, 'rejected'::text, 'waitlist'::text, 'cancelled'::text, 'muted'::text, 'banned'::text]));
