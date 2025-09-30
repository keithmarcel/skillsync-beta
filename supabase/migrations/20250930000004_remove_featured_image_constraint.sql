-- Migration: Remove featured image constraint
-- Date: 2025-09-30
-- Description: Remove constraint that requires featured_image_url when is_featured = true
--              This allows admins to mark programs as featured without immediately providing an image

-- Remove the constraint that blocks featured toggle
ALTER TABLE public.programs
DROP CONSTRAINT IF EXISTS chk_featured_program_has_image;

-- Add comment explaining the change
COMMENT ON COLUMN public.programs.featured_image_url IS 'Hero image URL for program detail pages (optional, recommended for featured programs)';
