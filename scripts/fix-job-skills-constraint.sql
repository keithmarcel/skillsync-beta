-- Check current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'job_skills'::regclass 
AND conname LIKE '%importance%';

-- Drop the existing constraint if it exists
ALTER TABLE job_skills DROP CONSTRAINT IF EXISTS job_skills_importance_level_check;

-- Add the correct constraint
ALTER TABLE job_skills 
ADD CONSTRAINT job_skills_importance_level_check 
CHECK (importance_level >= 1 AND importance_level <= 5);

-- Verify
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'job_skills'::regclass 
AND conname LIKE '%importance%';
