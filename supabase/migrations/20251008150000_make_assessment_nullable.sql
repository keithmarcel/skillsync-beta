-- Make assessment_id nullable in employer_invitations
-- This allows invitations to be sent before assessments are completed
-- Useful for demo purposes and initial outreach

BEGIN;

-- Drop the NOT NULL constraint on assessment_id
ALTER TABLE public.employer_invitations 
ALTER COLUMN assessment_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.employer_invitations.assessment_id IS 
'Optional reference to assessment - can be null if invitation sent before assessment completion';

COMMIT;
