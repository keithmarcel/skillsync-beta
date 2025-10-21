-- Standardize skill_band enum values across the application
-- Goal: Align database enums with code expectations and user-facing labels

-- Current state:
--   Database: proficient, building_proficiency, needs_development
--   Code expects: proficient, building, developing (or needs_dev)
--   UI shows: "Proficient", "Almost There", "Developing"

-- New standard:
--   Database: proficient, building, developing
--   Code: proficient, building, developing
--   UI: "Proficient", "Almost There", "Developing"

-- Step 1: Create new enum type with standardized values
CREATE TYPE skill_band_new AS ENUM (
  'proficient',      -- 80%+ mastery
  'building',        -- 60-79% building proficiency  
  'developing'       -- <60% needs development
);

-- Step 2: Add temporary column with new type
ALTER TABLE assessment_skill_results 
  ADD COLUMN band_new skill_band_new;

-- Step 3: Migrate existing data
UPDATE assessment_skill_results
SET band_new = CASE 
  WHEN band::text = 'proficient' THEN 'proficient'::skill_band_new
  WHEN band::text = 'building_proficiency' THEN 'building'::skill_band_new
  WHEN band::text = 'needs_development' THEN 'developing'::skill_band_new
  ELSE 'developing'::skill_band_new -- fallback
END;

-- Step 4: Drop old column and rename new one
ALTER TABLE assessment_skill_results DROP COLUMN band;
ALTER TABLE assessment_skill_results RENAME COLUMN band_new TO band;

-- Step 5: Drop old enum type
DROP TYPE skill_band;

-- Step 6: Rename new type to original name
ALTER TYPE skill_band_new RENAME TO skill_band;

-- Add helpful comment
COMMENT ON TYPE skill_band IS 'Standardized skill proficiency levels: proficient (80%+), building (60-79%), developing (<60%)';

-- Verify migration
DO $$
DECLARE
  enum_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO enum_count
  FROM pg_enum
  WHERE enumtypid = 'skill_band'::regtype;
  
  IF enum_count = 3 THEN
    RAISE NOTICE 'Migration successful: skill_band enum has 3 values';
  ELSE
    RAISE EXCEPTION 'Migration failed: skill_band enum has % values, expected 3', enum_count;
  END IF;
END $$;
