-- Add status_before_archive column to employer_invitations
-- This allows us to restore the previous status when unarchiving

ALTER TABLE employer_invitations 
ADD COLUMN IF NOT EXISTS status_before_archive TEXT;

-- Update existing archived records to store their current status
UPDATE employer_invitations
SET status_before_archive = status
WHERE status = 'archived' AND status_before_archive IS NULL;

COMMENT ON COLUMN employer_invitations.status_before_archive IS 'Stores the status before archiving, used to restore when unarchiving';
