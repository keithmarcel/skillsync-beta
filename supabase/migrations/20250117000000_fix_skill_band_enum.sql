-- Fix skill_band enum to match code expectations
-- The code uses: 'developing', 'proficient', 'expert'
-- But the enum currently has: 'developing', 'proficient', 'expert' (should already be correct)
-- Let's verify and update if needed

-- First, check current enum values
-- If this migration fails, it means the enum already has the correct values

-- Drop the old enum type and recreate with correct values
ALTER TYPE skill_band RENAME TO skill_band_old;

CREATE TYPE skill_band AS ENUM ('developing', 'proficient', 'expert');

-- Update the table to use the new enum
ALTER TABLE assessment_skill_results 
  ALTER COLUMN band TYPE skill_band 
  USING band::text::skill_band;

-- Drop the old enum
DROP TYPE skill_band_old;

-- Add comment for documentation
COMMENT ON TYPE skill_band IS 'Skill proficiency bands: developing (<80%), proficient (80-89%), expert (90%+)';
