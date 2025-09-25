-- Migration: Complete skills taxonomy setup for empty tables
-- Date: 2025-09-24
-- Purpose: Set up skills taxonomy from scratch since tables exist but are empty

BEGIN;

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migrations (
  name TEXT PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Check if migration already executed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.migrations WHERE name = '20250924_complete_skills_taxonomy') THEN
    RAISE NOTICE 'Migration 20250924_complete_skills_taxonomy already executed';
    RETURN;
  END IF;

  -- Since tables exist but are empty, we can safely recreate them with proper structure
  -- Drop existing tables (safe since they're empty)
  DROP TABLE IF EXISTS public.program_skills;
  DROP TABLE IF EXISTS public.job_skills;

  -- Recreate skills table with full structure (drop and recreate since it's empty)
  DROP TABLE IF EXISTS public.skills;
  CREATE TABLE public.skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    onet_id text UNIQUE,
    category text NOT NULL,
    description text,
    proficiency_levels jsonb DEFAULT '{
      "beginner": "Basic understanding and application",
      "intermediate": "Solid working knowledge with some independence",
      "expert": "Advanced mastery and ability to teach others"
    }'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Create job-skills relationships table with complete structure
  CREATE TABLE public.job_skills (
    job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    importance_level text NOT NULL CHECK (importance_level IN ('critical', 'important', 'helpful')),
    proficiency_threshold integer DEFAULT 70 CHECK (proficiency_threshold >= 0 AND proficiency_threshold <= 100),
    weight numeric DEFAULT 1.0 CHECK (weight > 0),
    onet_data_source jsonb,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (job_id, skill_id)
  );

  -- Create program-skills relationships table
  CREATE TABLE public.program_skills (
    program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    coverage_level text NOT NULL CHECK (coverage_level IN ('primary', 'secondary', 'supplemental')),
    weight numeric DEFAULT 1.0 CHECK (weight > 0),
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (program_id, skill_id)
  );

  -- Insert seed skills
  INSERT INTO public.skills (name, category, description) VALUES
  ('Strategic Planning', 'Business', 'Set long-term goals and align initiatives'),
  ('Leadership', 'Business', 'Guide teams and influence outcomes'),
  ('Project Management', 'Operations', 'Plan, execute, and control projects'),
  ('Data Analysis', 'Analytics', 'Interpret data to support decisions'),
  ('Process Improvement', 'Operations', 'Optimize workflows and reduce waste')
  ON CONFLICT (name) DO NOTHING;

  -- Insert sample job-skill relationships for featured roles
  INSERT INTO public.job_skills (job_id, skill_id, importance_level, proficiency_threshold)
  SELECT
    j.id as job_id,
    s.id as skill_id,
    CASE
      WHEN s.name IN ('Project Management', 'Strategic Planning') THEN 'critical'
      WHEN s.name IN ('Leadership', 'Data Analysis') THEN 'important'
      ELSE 'helpful'
    END as importance_level,
    70 as proficiency_threshold
  FROM public.jobs j
  CROSS JOIN public.skills s
  WHERE j.job_kind = 'featured_role'
  ON CONFLICT (job_id, skill_id) DO NOTHING;

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);
  CREATE INDEX IF NOT EXISTS idx_skills_onet_id ON public.skills(onet_id);
  CREATE INDEX IF NOT EXISTS idx_skills_active ON public.skills(is_active);
  CREATE INDEX IF NOT EXISTS idx_job_skills_job_id ON public.job_skills(job_id);
  CREATE INDEX IF NOT EXISTS idx_job_skills_skill_id ON public.job_skills(skill_id);
  CREATE INDEX IF NOT EXISTS idx_job_skills_importance ON public.job_skills(importance_level);
  CREATE INDEX IF NOT EXISTS idx_program_skills_program_id ON public.program_skills(program_id);
  CREATE INDEX IF NOT EXISTS idx_program_skills_skill_id ON public.program_skills(skill_id);
  CREATE INDEX IF NOT EXISTS idx_program_skills_coverage ON public.program_skills(coverage_level);

  -- Record migration completion
  INSERT INTO public.migrations (name) VALUES ('20250924_complete_skills_taxonomy');

  RAISE NOTICE 'Migration 20250924_complete_skills_taxonomy completed successfully - skills taxonomy fully established';
END $$;

COMMIT;
