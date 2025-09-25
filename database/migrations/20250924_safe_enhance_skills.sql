-- Migration: Safely enhance skills taxonomy based on actual database state
-- Date: 2025-09-24
-- Purpose: Add missing columns to skills tables without assumptions

BEGIN;

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migrations (
  name TEXT PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Check if migration already executed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.migrations WHERE name = '20250924_safe_enhance_skills') THEN
    RAISE NOTICE 'Migration 20250924_safe_enhance_skills already executed';
    RETURN;
  END IF;

  -- Safely enhance job_skills table
  -- Add importance_level column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_skills'
      AND column_name = 'importance_level'
  ) THEN
    ALTER TABLE public.job_skills
    ADD COLUMN importance_level text NOT NULL DEFAULT 'helpful'
    CHECK (importance_level IN ('critical', 'important', 'helpful'));
    RAISE NOTICE 'Added importance_level column to job_skills';
  END IF;

  -- Add proficiency_threshold column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_skills'
      AND column_name = 'proficiency_threshold'
  ) THEN
    ALTER TABLE public.job_skills
    ADD COLUMN proficiency_threshold integer DEFAULT 70
    CHECK (proficiency_threshold >= 0 AND proficiency_threshold <= 100);
    RAISE NOTICE 'Added proficiency_threshold column to job_skills';
  END IF;

  -- Add onet_data_source column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_skills'
      AND column_name = 'onet_data_source'
  ) THEN
    ALTER TABLE public.job_skills ADD COLUMN onet_data_source jsonb;
    RAISE NOTICE 'Added onet_data_source column to job_skills';
  END IF;

  -- Add created_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_skills'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.job_skills ADD COLUMN created_at timestamptz DEFAULT now();
    RAISE NOTICE 'Added created_at column to job_skills';
  END IF;

  -- Create program_skills table if it doesn't exist at all
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'program_skills'
  ) THEN
    CREATE TABLE public.program_skills (
      program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
      skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
      coverage_level text NOT NULL DEFAULT 'secondary' CHECK (coverage_level IN ('primary', 'secondary', 'supplemental')),
      weight numeric DEFAULT 1.0 CHECK (weight > 0),
      created_at timestamptz DEFAULT now(),
      PRIMARY KEY (program_id, skill_id)
    );
    RAISE NOTICE 'Created program_skills table';
  ELSE
    -- If program_skills exists, ensure it has all required columns

    -- Add coverage_level column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'program_skills'
        AND column_name = 'coverage_level'
    ) THEN
      ALTER TABLE public.program_skills
      ADD COLUMN coverage_level text NOT NULL DEFAULT 'secondary'
      CHECK (coverage_level IN ('primary', 'secondary', 'supplemental'));
      RAISE NOTICE 'Added coverage_level column to program_skills';
    END IF;

    -- Add created_at column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'program_skills'
        AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.program_skills ADD COLUMN created_at timestamptz DEFAULT now();
      RAISE NOTICE 'Added created_at column to program_skills';
    END IF;
  END IF;

  -- Update existing job_skills records with importance levels based on weight
  -- Only update records that still have the default 'helpful' value
  UPDATE public.job_skills
  SET
    importance_level = CASE
      WHEN weight >= 1.5 THEN 'critical'
      WHEN weight >= 1.2 THEN 'important'
      ELSE 'helpful'
    END,
    proficiency_threshold = CASE
      WHEN weight >= 1.5 THEN 85
      WHEN weight >= 1.2 THEN 75
      ELSE 65
    END
  WHERE importance_level = 'helpful' OR importance_level IS NULL;

  RAISE NOTICE 'Updated existing job_skills records with importance levels';

  -- Create indexes for performance (only if columns exist)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_skills'
      AND column_name = 'importance_level'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_job_skills_importance ON public.job_skills(importance_level);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_skills'
      AND column_name = 'coverage_level'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_program_skills_coverage ON public.program_skills(coverage_level);
  END IF;

  -- Record migration completion
  INSERT INTO public.migrations (name) VALUES ('20250924_safe_enhance_skills');

  RAISE NOTICE 'Migration 20250924_safe_enhance_skills completed successfully';
END $$;

COMMIT;
