-- Fix jobs table schema to properly support both featured roles and high demand occupations
-- This migration addresses the enum mismatch and adds missing columns

-- First, update the job_kind enum to match remote database
-- ALTER TYPE public.job_kind RENAME VALUE 'high_demand' TO 'occupation';

-- Add missing columns to support both job types properly
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS employment_outlook text,
ADD COLUMN IF NOT EXISTS education_level text,
ADD COLUMN IF NOT EXISTS work_experience text,
ADD COLUMN IF NOT EXISTS on_job_training text,
ADD COLUMN IF NOT EXISTS job_openings_annual integer,
ADD COLUMN IF NOT EXISTS growth_rate_percent numeric,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_job_kind ON public.jobs(job_kind);
CREATE INDEX IF NOT EXISTS idx_jobs_is_featured ON public.jobs(is_featured);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);

-- Add constraints to ensure data integrity
ALTER TABLE public.jobs 
ADD CONSTRAINT chk_featured_role_has_company 
CHECK (
  (job_kind = 'featured_role' AND company_id IS NOT NULL) OR 
  (job_kind = 'occupation')
);

-- Add constraint to ensure SOC codes for occupations
ALTER TABLE public.jobs 
ADD CONSTRAINT chk_occupation_has_soc 
CHECK (
  (job_kind = 'occupation' AND soc_code IS NOT NULL) OR 
  (job_kind = 'featured_role')
);

-- Update existing data to set is_featured flag
UPDATE public.jobs 
SET is_featured = true 
WHERE job_kind = 'featured_role';

-- Add comments for clarity
COMMENT ON COLUMN public.jobs.job_kind IS 'Type of job: featured_role (company-specific roles) or occupation (labor market data)';
COMMENT ON COLUMN public.jobs.is_featured IS 'Whether this job should appear in featured sections';
COMMENT ON COLUMN public.jobs.company_id IS 'Required for featured_role, null for occupation';
COMMENT ON COLUMN public.jobs.soc_code IS 'Required for occupation, optional for featured_role';
COMMENT ON COLUMN public.jobs.employment_outlook IS 'Labor market outlook for occupations';
COMMENT ON COLUMN public.jobs.education_level IS 'Typical education requirement';
COMMENT ON COLUMN public.jobs.job_openings_annual IS 'Annual job openings projection';
COMMENT ON COLUMN public.jobs.growth_rate_percent IS 'Employment growth rate percentage';
