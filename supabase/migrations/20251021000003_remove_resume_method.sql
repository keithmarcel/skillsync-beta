-- Remove 'resume' method from assessment_method enum
-- Only 'quiz' method will be supported going forward

-- Step 1: Update any existing 'resume' assessments to 'quiz'
UPDATE assessments 
SET method = 'quiz' 
WHERE method = 'resume';

-- Step 2: Drop the old enum type and create new one
ALTER TYPE assessment_method RENAME TO assessment_method_old;

CREATE TYPE assessment_method AS ENUM ('quiz');

-- Step 3: Alter the column to use the new type
ALTER TABLE assessments 
  ALTER COLUMN method TYPE assessment_method 
  USING method::text::assessment_method;

-- Step 4: Drop the old type
DROP TYPE assessment_method_old;

-- Add comment
COMMENT ON TYPE assessment_method IS 'Assessment method: quiz only (resume method deprecated)';
