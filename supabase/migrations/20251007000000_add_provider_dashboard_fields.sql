-- Add fields needed for provider dashboard
-- Date: 2025-10-07

-- Add missing fields to programs table
ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS inquiries_count INTEGER DEFAULT 0;

-- Add missing fields to schools table for provider profile
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

-- Add school_id to profiles for provider association
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_programs_school_id ON public.programs(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);

-- Add comment
COMMENT ON COLUMN public.programs.is_featured IS 'Whether this program is featured (max 5 per school)';
COMMENT ON COLUMN public.programs.is_published IS 'Whether this program is published and visible to users';
COMMENT ON COLUMN public.programs.inquiries_count IS 'Number of student inquiries for this program';
