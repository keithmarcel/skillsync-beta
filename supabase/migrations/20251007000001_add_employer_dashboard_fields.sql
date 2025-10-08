-- Add fields needed for employer dashboard
-- Date: 2025-10-07

-- Add missing fields to jobs table for employer management
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS assessments_count INTEGER DEFAULT 0;

-- Add missing fields to companies table for employer profile
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

-- Add company_id to profiles for employer association
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_employer_invitations_company_id ON public.employer_invitations(company_id);

-- Add comment
COMMENT ON COLUMN public.jobs.is_published IS 'Whether this job is published and visible to users';
COMMENT ON COLUMN public.jobs.assessments_count IS 'Number of assessments taken for this role';
COMMENT ON COLUMN public.jobs.visibility_threshold_pct IS 'Proficiency threshold for employer to see candidates (default 85%)';
COMMENT ON COLUMN public.jobs.required_proficiency_pct IS 'Required proficiency shown to users for "Role Ready" status (default 90%)';
