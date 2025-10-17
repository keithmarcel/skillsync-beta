-- Create role_program_crosswalk table for AI-powered program recommendations
-- This table stores intelligent mappings between roles and relevant training programs
-- Used for: Role detail pages, gap analysis recommendations, upskilling suggestions

CREATE TABLE IF NOT EXISTS public.role_program_crosswalk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  
  -- AI confidence and reasoning
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  match_reasoning TEXT,
  
  -- Contextual metadata
  recommended_for TEXT[], -- e.g., ['entry_level', 'upskilling', 'gap_filling']
  skill_alignment_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique job-program pairs
  UNIQUE(job_id, program_id)
);

-- Indexes for performance
CREATE INDEX idx_role_program_crosswalk_job_id ON public.role_program_crosswalk(job_id);
CREATE INDEX idx_role_program_crosswalk_program_id ON public.role_program_crosswalk(program_id);
CREATE INDEX idx_role_program_crosswalk_confidence ON public.role_program_crosswalk(confidence_score DESC);

-- RLS Policies (public read, admin write)
ALTER TABLE public.role_program_crosswalk ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crosswalk" ON public.role_program_crosswalk
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage crosswalk" ON public.role_program_crosswalk
  FOR ALL USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.role_program_crosswalk IS 'AI-powered crosswalk between roles and training programs for recommendations';
COMMENT ON COLUMN public.role_program_crosswalk.confidence_score IS 'AI confidence score (0-1) for program relevance to role';
COMMENT ON COLUMN public.role_program_crosswalk.match_reasoning IS 'AI explanation of why this program matches the role';
COMMENT ON COLUMN public.role_program_crosswalk.recommended_for IS 'Context tags: entry_level, upskilling, gap_filling, career_change';
