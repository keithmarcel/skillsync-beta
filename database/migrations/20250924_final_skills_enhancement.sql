-- Migration: Enhance existing skills taxonomy tables
-- Date: 2025-09-24
-- Purpose: Add missing columns to existing skills tables without dropping dependencies

BEGIN;

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migrations (
  name TEXT PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Check if migration already executed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.migrations WHERE name = '20250924_enhance_existing_skills') THEN
    RAISE NOTICE 'Migration 20250924_enhance_existing_skills already executed';
    RETURN;
  END IF;

  -- Check what skills table structure we actually have
  RAISE NOTICE 'Checking existing skills table structure...';

  -- Add missing columns to skills table if they don't exist
  -- (Can't drop due to foreign key dependencies)

  -- Add category column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'skills'
      AND column_name = 'category'
  ) THEN
    ALTER TABLE public.skills ADD COLUMN category text;
    RAISE NOTICE 'Added category column to skills table';
  END IF;

  -- Add description column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'skills'
      AND column_name = 'description'
  ) THEN
    ALTER TABLE public.skills ADD COLUMN description text;
    RAISE NOTICE 'Added description column to skills table';
  END IF;

  -- Add proficiency_levels column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'skills'
      AND column_name = 'proficiency_levels'
  ) THEN
    ALTER TABLE public.skills ADD COLUMN proficiency_levels jsonb DEFAULT '{
      "beginner": "Basic understanding and application",
      "intermediate": "Solid working knowledge with some independence",
      "expert": "Advanced mastery and ability to teach others"
    }'::jsonb;
    RAISE NOTICE 'Added proficiency_levels column to skills table';
  END IF;

  -- Add is_active column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'skills'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.skills ADD COLUMN is_active boolean DEFAULT true;
    RAISE NOTICE 'Added is_active column to skills table';
  END IF;

  -- Add created_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'skills'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.skills ADD COLUMN created_at timestamptz DEFAULT now();
    RAISE NOTICE 'Added created_at column to skills table';
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'skills'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.skills ADD COLUMN updated_at timestamptz DEFAULT now();
    RAISE NOTICE 'Added updated_at column to skills table';
  END IF;

  -- Now enhance job_skills table
  RAISE NOTICE 'Enhancing job_skills table...';

  -- Add importance_level column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_skills'
      AND column_name = 'importance_level'
  ) THEN
    ALTER TABLE public.job_skills ADD COLUMN importance_level text DEFAULT 'helpful' CHECK (importance_level IN ('critical', 'important', 'helpful'));
    RAISE NOTICE 'Added importance_level column to job_skills';
  END IF;

  -- Add proficiency_threshold column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_skills'
      AND column_name = 'proficiency_threshold'
  ) THEN
    ALTER TABLE public.job_skills ADD COLUMN proficiency_threshold integer DEFAULT 70 CHECK (proficiency_threshold >= 0 AND proficiency_threshold <= 100);
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

  -- Now handle program_skills table
  RAISE NOTICE 'Setting up program_skills table...';

  -- Create program_skills table if it doesn't exist
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
  END IF;

  -- Insert seed skills data (only if table is empty)
  IF NOT EXISTS (SELECT 1 FROM public.skills LIMIT 1) THEN
    INSERT INTO public.skills (name, category, description) VALUES
    ('Strategic Planning', 'Business', 'Set long-term goals and align initiatives'),
    ('Leadership', 'Business', 'Guide teams and influence outcomes'),
    ('Project Management', 'Operations', 'Plan, execute, and control projects'),
    ('Data Analysis', 'Analytics', 'Interpret data to support decisions'),
    ('Process Improvement', 'Operations', 'Optimize workflows and reduce waste');
    RAISE NOTICE 'Inserted seed skills data';
  END IF;

  -- Create sample job-skill relationships (only if job_skills is empty)
  IF NOT EXISTS (SELECT 1 FROM public.job_skills LIMIT 1) THEN
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
    WHERE j.job_kind = 'featured_role';
    RAISE NOTICE 'Created sample job-skill relationships';
  END IF;

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

  RAISE NOTICE 'Created performance indexes';

  -- Record migration completion
  INSERT INTO public.migrations (name) VALUES ('20250924_enhance_existing_skills');

  RAISE NOTICE 'Migration 20250924_enhance_existing_skills completed successfully';
END $$;

COMMIT;
