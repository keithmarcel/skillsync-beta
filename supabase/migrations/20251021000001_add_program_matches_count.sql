-- Add program_matches_count column to assessments table
-- This stores the count of matching programs for each assessment
-- Calculated during assessment analysis to avoid expensive real-time queries

ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS program_matches_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN assessments.program_matches_count IS 'Number of programs that match the user skill gaps (calculated during analysis with 95% threshold)';

-- Create index for filtering/sorting by program matches
CREATE INDEX IF NOT EXISTS idx_assessments_program_matches_count 
ON assessments(program_matches_count) 
WHERE program_matches_count > 0;
