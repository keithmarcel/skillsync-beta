-- Migration: Add enrichment fields to schools table
-- Description: Add fields for AI-enriched school data (bio, profile image, etc.)

-- Add bio column for school description
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add profile_image_url for featured/hero images
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add about_url for school website (if not already exists)
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS about_url TEXT;

-- Comment on new columns
COMMENT ON COLUMN public.schools.bio IS 'School description/bio for About the School modal';
COMMENT ON COLUMN public.schools.profile_image_url IS 'Featured/hero image URL for school profile';
COMMENT ON COLUMN public.schools.about_url IS 'Official school website URL';
