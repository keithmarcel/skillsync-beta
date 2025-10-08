-- LAiSER SOC Enhancement - Schema Migration
-- Adds curation metadata to skills table for admin control over AI-extracted skills

-- Add curation status column
ALTER TABLE skills ADD COLUMN IF NOT EXISTS
  curation_status TEXT DEFAULT 'pending_review'
  CHECK (curation_status IN ('auto_approved', 'pending_review', 'admin_approved', 'rejected'));

-- Add confidence score for LAiSER extractions
ALTER TABLE skills ADD COLUMN IF NOT EXISTS
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100);

-- Add admin review tracking
ALTER TABLE skills ADD COLUMN IF NOT EXISTS
  reviewed_by UUID REFERENCES auth.users(id);

ALTER TABLE skills ADD COLUMN IF NOT EXISTS
  reviewed_at TIMESTAMPTZ;

-- Add index for performance on curation queries
CREATE INDEX IF NOT EXISTS idx_skills_curation_status ON skills(curation_status);
CREATE INDEX IF NOT EXISTS idx_skills_confidence_score ON skills(confidence_score);

-- Add comment for documentation
COMMENT ON COLUMN skills.curation_status IS 'Status of AI-extracted skills: auto_approved (>85% confidence), pending_review (60-84%), admin_approved (manual), rejected (<30%)';
COMMENT ON COLUMN skills.confidence_score IS 'LAiSER AI confidence score (0-100) for extracted skills';
COMMENT ON COLUMN skills.reviewed_by IS 'Admin user who reviewed this skill';
COMMENT ON COLUMN skills.reviewed_at IS 'Timestamp when skill was reviewed by admin';

-- Migration verification query
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'skills' AND column_name IN ('curation_status', 'confidence_score', 'reviewed_by', 'reviewed_at')
-- ORDER BY ordinal_position;
