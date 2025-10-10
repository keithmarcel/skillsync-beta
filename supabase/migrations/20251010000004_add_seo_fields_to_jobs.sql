-- Add SEO and Open Graph fields to jobs table
-- These fields are used for search engine optimization and social media sharing

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS og_image TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add comments explaining each column
COMMENT ON COLUMN public.jobs.seo_title IS 'SEO-optimized title for search engines (50-60 characters)';
COMMENT ON COLUMN public.jobs.meta_description IS 'Meta description for search results (150-160 characters)';
COMMENT ON COLUMN public.jobs.og_title IS 'Open Graph title for social media shares (60-90 characters)';
COMMENT ON COLUMN public.jobs.og_description IS 'Open Graph description for social media shares (150-200 characters)';
COMMENT ON COLUMN public.jobs.og_image IS 'Open Graph image URL for social media shares (inherits from featured_image_url if not set)';
COMMENT ON COLUMN public.jobs.slug IS 'URL-friendly slug for the job posting';
