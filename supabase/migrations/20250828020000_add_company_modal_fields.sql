-- Add company image field for modal display
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_image_url text;
