-- Update commissions table to support multiple promo codes

-- 1. Add new column promo_ids
ALTER TABLE public.commissions ADD COLUMN promo_ids TEXT[] DEFAULT '{}';

-- 2. Copy existing promo_id data into promo_ids array
UPDATE public.commissions
SET promo_ids = ARRAY[promo_id]
WHERE promo_id IS NOT NULL AND promo_id != '';

-- 3. Drop old columns
ALTER TABLE public.commissions DROP COLUMN promo_id;
ALTER TABLE public.commissions DROP COLUMN promotion_code; -- Since we can just use the IDs

-- Note: schema.sql and migration.sql will be manually updated in the repo.
