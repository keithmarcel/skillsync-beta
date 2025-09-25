-- Migration: Add missing columns to existing skills taxonomy tables
-- Date: 2025-09-24
-- Purpose: Enhance existing job_skills and program_skills tables with importance levels and proficiency data

BEGIN;

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migrations (
  name TEXT PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Check if migration already executed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.migrations WHERE name = '20250924_enhance_skills_taxonomy') THEN
    RAISE NOTICE 'Migration 20250924_enhance_skills_taxonomy already executed';
    RETURN;
  END IF;

  -- Add missing columns to job_skills table
  ALTER TABLE public.job_skills ADD COLUMN IF NOT EXISTS importance_level text NOT NULL DEFAULT 'helpful' CHECK (importance_level IN ('critical', 'important', 'helpful'));
  ALTER TABLE public.job_skills ADD COLUMN IF NOT EXISTS proficiency_threshold integer DEFAULT 70 CHECK (proficiency_threshold >= 0 AND proficiency_threshold <= 100);
  ALTER TABLE public.job_skills ADD COLUMN IF NOT EXISTS onet_data_source jsonb;
  ALTER TABLE public.job_skills ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

  -- Create program_skills table if it doesn't exist (outside nested DO block)
  CREATE TABLE IF NOT EXISTS public.program_skills (
    program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    coverage_level text NOT NULL DEFAULT 'secondary' CHECK (coverage_level IN ('primary', 'secondary', 'supplemental')),
    weight numeric DEFAULT 1.0 CHECK (weight > 0),
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (program_id, skill_id)
  );

  -- Update existing job_skills records with importance levels based on weight
  -- Higher weights get higher importance levels
  UPDATE public.job_skills
  SET
    importance_level = CASE
      WHEN weight >= 1.5 THEN 'critical'
      WHEN weight >= 1.2 THEN 'important'
      ELSE 'helpful'
    END,
    proficiency_threshold = CASE
      WHEN weight >= 1.5 THEN 85  -- Critical skills need higher proficiency
      WHEN weight >= 1.2 THEN 75  -- Important skills need good proficiency
      ELSE 65  -- Helpful skills need basic proficiency
    END
  WHERE importance_level = 'helpful'; -- Only update default values

  -- Create indexes for the new columns
  CREATE INDEX IF NOT EXISTS idx_job_skills_importance ON public.job_skills(importance_level);
  CREATE INDEX IF NOT EXISTS idx_program_skills_coverage ON public.program_skills(coverage_level);

  -- Record migration completion
  INSERT INTO public.migrations (name) VALUES ('20250924_enhance_skills_taxonomy');

  RAISE NOTICE 'Migration 20250924_enhance_skills_taxonomy completed successfully';
END $$;

COMMIT;
