-- Fix skill_band enum to match code expectations
-- The code uses: 'proficient', 'building_proficiency', 'needs_development'

-- Create or replace the enum type
DROP TYPE IF EXISTS skill_band CASCADE;

CREATE TYPE skill_band AS ENUM (
  'proficient',
  'building_proficiency', 
  'needs_development'
);

-- Add band column to assessment_skill_results if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'assessment_skill_results' 
    AND column_name = 'band'
  ) THEN
    ALTER TABLE public.assessment_skill_results 
      ADD COLUMN band skill_band;
    
    RAISE NOTICE 'Added band column to assessment_skill_results';
  ELSE
    RAISE NOTICE 'Band column already exists';
  END IF;
END $$;

COMMENT ON TYPE skill_band IS 'Skill proficiency bands: proficient (80%+), building_proficiency (60-79%), needs_development (<60%)';
