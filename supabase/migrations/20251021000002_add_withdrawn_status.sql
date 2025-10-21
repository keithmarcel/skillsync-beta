-- Add 'withdrawn' status to employer_invitations
-- Used when user toggles consent OFF

-- Drop the existing check constraint
ALTER TABLE employer_invitations 
DROP CONSTRAINT IF EXISTS employer_invitations_status_check;

-- Add new check constraint with 'withdrawn' status
ALTER TABLE employer_invitations 
ADD CONSTRAINT employer_invitations_status_check 
CHECK (status IN ('pending', 'sent', 'applied', 'declined', 'hired', 'unqualified', 'archived', 'withdrawn'));

-- Add comment
COMMENT ON COLUMN employer_invitations.status IS 'Invitation status: pending, sent, applied, declined, hired, unqualified, archived, withdrawn (user revoked consent)';

-- Add index for withdrawn status filtering
CREATE INDEX IF NOT EXISTS idx_employer_invitations_withdrawn 
ON employer_invitations(status) 
WHERE status = 'withdrawn';
