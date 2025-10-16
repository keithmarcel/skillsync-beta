-- Add employer read tracking to employer_invitations table
-- This allows employers to track which candidate responses they've seen

ALTER TABLE employer_invitations
ADD COLUMN IF NOT EXISTS is_read_by_employer BOOLEAN DEFAULT false;

-- Create index for efficient querying of unread employer notifications
CREATE INDEX IF NOT EXISTS idx_employer_invitations_employer_unread 
ON employer_invitations(company_id, is_read_by_employer) 
WHERE is_read_by_employer = false AND status IN ('applied', 'declined');

-- Add comment
COMMENT ON COLUMN employer_invitations.is_read_by_employer IS 'Tracks if employer has viewed candidate response (applied/declined)';
