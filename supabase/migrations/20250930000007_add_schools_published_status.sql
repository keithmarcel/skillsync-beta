-- Migration: Add published status to schools (education providers)
-- Date: 2025-09-30
-- Description: Allow admins to control visibility of schools and their programs in the main app

-- Add is_published column to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Add index for filtering published schools
CREATE INDEX IF NOT EXISTS idx_schools_is_published ON public.schools(is_published);

-- Add comment
COMMENT ON COLUMN public.schools.is_published IS 'Controls whether this school and its programs are visible in the main app. When false, all programs from this school are hidden.';

-- Note: Programs filtering will be handled in application logic
-- When fetching programs, filter by: programs.school.is_published = true
