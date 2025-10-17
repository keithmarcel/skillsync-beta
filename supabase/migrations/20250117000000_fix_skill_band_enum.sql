-- Fix skill_band enum to match code expectations
-- The code uses: 'developing', 'proficient', 'expert'
-- The database currently has old values like 'building', 'needs_dev' in the data

-- Step 1: Convert the column to text temporarily
ALTER TABLE assessment_skill_results 
  ALTER COLUMN band TYPE text;

-- Step 2: Update existing data to use new values
UPDATE assessment_skill_results
SET band = CASE 
  WHEN band = 'building' THEN 'developing'
  WHEN band = 'needs_dev' THEN 'developing'
  ELSE band
END;

-- Step 3: Drop and recreate the enum with correct values
DROP TYPE IF EXISTS skill_band CASCADE;
CREATE TYPE skill_band AS ENUM ('developing', 'proficient', 'expert');

-- Step 4: Convert the column back to the enum type
ALTER TABLE assessment_skill_results 
  ALTER COLUMN band TYPE skill_band 
  USING band::skill_band;

-- Add comment for documentation
COMMENT ON TYPE skill_band IS 'Skill proficiency bands: developing (<80%), proficient (80-89%), expert (90%+)';
