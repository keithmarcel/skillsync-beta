-- Employer Invitations System for Job Seekers
-- Enables employers to invite qualified candidates to apply for featured roles

-- Ensure required_proficiency_pct exists (should exist from previous migration)
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS required_proficiency_pct NUMERIC DEFAULT 90;

-- Add application_url and visibility_threshold_pct to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS application_url TEXT,
ADD COLUMN IF NOT EXISTS visibility_threshold_pct NUMERIC DEFAULT 85;

-- Add comments explaining the proficiency fields
DO $$ 
BEGIN
  EXECUTE 'COMMENT ON COLUMN public.jobs.required_proficiency_pct IS ''Proficiency threshold shown to users for "Role Ready" status (typically 90%)''';
  EXECUTE 'COMMENT ON COLUMN public.jobs.visibility_threshold_pct IS ''Proficiency threshold for employer visibility - candidates at or above this score appear in employer candidate pool (typically 85%)''';
  EXECUTE 'COMMENT ON COLUMN public.jobs.application_url IS ''External URL to company ATS/application page (required for featured roles)''';
END $$;

-- Create employer_invitations table
CREATE TABLE IF NOT EXISTS public.employer_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  proficiency_pct NUMERIC NOT NULL,
  application_url TEXT NOT NULL,
  message TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'applied', 'declined', 'hired', 'unqualified', 'archived')),
  is_read BOOLEAN DEFAULT false,
  invited_at TIMESTAMP,
  viewed_at TIMESTAMP,
  responded_at TIMESTAMP,
  archived_at TIMESTAMP,
  archived_by VARCHAR CHECK (archived_by IN ('employer', 'candidate')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure one invitation per user per role
CREATE UNIQUE INDEX idx_employer_invitations_unique ON public.employer_invitations(user_id, job_id);

-- Indexes for performance
CREATE INDEX idx_employer_invitations_user_id ON public.employer_invitations(user_id);
CREATE INDEX idx_employer_invitations_company_id ON public.employer_invitations(company_id);
CREATE INDEX idx_employer_invitations_job_id ON public.employer_invitations(job_id);
CREATE INDEX idx_employer_invitations_status ON public.employer_invitations(status);
CREATE INDEX idx_employer_invitations_is_read ON public.employer_invitations(is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.employer_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employer_invitations

-- Users can view their own invitations
CREATE POLICY "Users can view own invitations" ON public.employer_invitations
FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own invitations (mark as applied/declined/archived)
CREATE POLICY "Users can update own invitations" ON public.employer_invitations
FOR UPDATE USING (auth.uid() = user_id);

-- Employer admins can view invitations for their company
CREATE POLICY "Employer admins can view company invitations" ON public.employer_invitations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'employer_admin'
    AND profiles.company_id = employer_invitations.company_id
  )
);

-- Employer admins can create invitations for their company
CREATE POLICY "Employer admins can create invitations" ON public.employer_invitations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'employer_admin'
    AND profiles.company_id = employer_invitations.company_id
  )
);

-- Employer admins can update invitations for their company
CREATE POLICY "Employer admins can update company invitations" ON public.employer_invitations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'employer_admin'
    AND profiles.company_id = employer_invitations.company_id
  )
);

-- Super admins can manage all invitations
CREATE POLICY "Super admins can manage all invitations" ON public.employer_invitations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Function to auto-populate employer candidate pool when assessment is completed
CREATE OR REPLACE FUNCTION public.auto_populate_employer_candidates()
RETURNS TRIGGER AS $$
DECLARE
  v_job RECORD;
  v_company_id UUID;
  v_application_url TEXT;
BEGIN
  -- Only process if assessment is completed and has a readiness score
  IF NEW.readiness_pct IS NULL OR NEW.job_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get job details including visibility threshold and company
  SELECT 
    j.id,
    j.company_id,
    j.visibility_threshold_pct,
    j.application_url,
    j.job_kind
  INTO v_job
  FROM public.jobs j
  WHERE j.id = NEW.job_id;

  -- Only create invitation records for featured roles (not occupations)
  IF v_job.job_kind != 'featured_role' OR v_job.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if candidate meets visibility threshold
  IF NEW.readiness_pct >= COALESCE(v_job.visibility_threshold_pct, 85) THEN
    -- Insert or update invitation record with status='pending'
    INSERT INTO public.employer_invitations (
      user_id,
      company_id,
      job_id,
      assessment_id,
      proficiency_pct,
      application_url,
      status
    ) VALUES (
      NEW.user_id,
      v_job.company_id,
      NEW.job_id,
      NEW.id,
      NEW.readiness_pct,
      COALESCE(v_job.application_url, 'https://google.com'),
      'pending'
    )
    ON CONFLICT (user_id, job_id) 
    DO UPDATE SET
      assessment_id = NEW.id,
      proficiency_pct = NEW.readiness_pct,
      updated_at = NOW()
    WHERE employer_invitations.proficiency_pct < NEW.readiness_pct; -- Only update if new score is higher
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-populate candidates after assessment completion
CREATE TRIGGER trigger_auto_populate_employer_candidates
AFTER INSERT OR UPDATE OF readiness_pct ON public.assessments
FOR EACH ROW
EXECUTE FUNCTION public.auto_populate_employer_candidates();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_employer_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_employer_invitations_updated_at
BEFORE UPDATE ON public.employer_invitations
FOR EACH ROW
EXECUTE FUNCTION public.handle_employer_invitations_updated_at();

-- Update existing featured roles to have default application_url if null
UPDATE public.jobs
SET application_url = 'https://google.com'
WHERE job_kind = 'featured_role' AND application_url IS NULL;

-- Add constraint to require application_url for featured roles
ALTER TABLE public.jobs
ADD CONSTRAINT featured_roles_require_application_url CHECK (
  job_kind != 'featured_role' OR application_url IS NOT NULL
);
