-- Add retake cooldown toggle to jobs table
-- Story: EMPLOYER-613 - Retake Policy Override per Role

-- Add boolean field for retake cooldown
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS retake_cooldown_enabled BOOLEAN DEFAULT true;

-- Update existing rows to have the default value
UPDATE jobs 
SET retake_cooldown_enabled = true 
WHERE retake_cooldown_enabled IS NULL;

-- Add column comment
COMMENT ON COLUMN jobs.retake_cooldown_enabled IS 
'Whether 24-hour retake cooldown is enforced for this role. true = cooldown enabled (default), false = unlimited retakes';

-- Create index for queries filtering by cooldown status
CREATE INDEX IF NOT EXISTS idx_jobs_retake_cooldown_enabled 
ON jobs(retake_cooldown_enabled) 
WHERE retake_cooldown_enabled = false;
