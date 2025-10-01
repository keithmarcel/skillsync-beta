-- Migration: Add program_jobs junction table for manual curation
-- Date: 2025-09-30
-- Description: Allow admins to manually link programs to jobs beyond automatic CIP-SOC crosswalk

-- Create program_jobs junction table
CREATE TABLE IF NOT EXISTS public.program_jobs (
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  match_type text NOT NULL DEFAULT 'manual', -- 'auto' from crosswalk, 'manual' from admin, 'fuzzy' from skill matching
  match_confidence numeric DEFAULT 1.0, -- 0-1 confidence score
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  notes text, -- Admin notes about why this match was made
  PRIMARY KEY (program_id, job_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_program_jobs_program_id ON public.program_jobs(program_id);
CREATE INDEX IF NOT EXISTS idx_program_jobs_job_id ON public.program_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_program_jobs_match_type ON public.program_jobs(match_type);

-- Add comments
COMMENT ON TABLE public.program_jobs IS 'Junction table linking programs to jobs - supports both automatic (crosswalk) and manual (admin) associations';
COMMENT ON COLUMN public.program_jobs.match_type IS 'How the match was created: auto (CIP-SOC crosswalk), manual (admin curated), fuzzy (skill-based matching)';
COMMENT ON COLUMN public.program_jobs.match_confidence IS 'Confidence score 0-1, where 1.0 = exact match, lower = weaker match';
COMMENT ON COLUMN public.program_jobs.notes IS 'Admin notes explaining manual matches or match reasoning';

-- Enable RLS
ALTER TABLE public.program_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read program-job associations
CREATE POLICY "Anyone can view program-job associations"
  ON public.program_jobs
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Admins can manage program-job associations"
  ON public.program_jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IS NOT NULL
    )
  );
