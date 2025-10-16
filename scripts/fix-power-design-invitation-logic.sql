-- Fix Power Design invitation data to have logical flow
-- CORRECTED Status flow: pending → sent → applied → hired
-- Math must work: Applications Received (3) >= Candidates Hired (2)

-- Check current status distribution
SELECT 
  status,
  COUNT(*) as count
FROM employer_invitations
WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design')
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'sent' THEN 2
    WHEN 'applied' THEN 3
    WHEN 'hired' THEN 4
    WHEN 'declined' THEN 5
    WHEN 'unqualified' THEN 6
    WHEN 'archived' THEN 7
  END;

-- Update to create logical flow:
-- 4 pending (ready to invite)
-- 2 sent (invited, awaiting response)
-- 3 applied (responded - applied) ← MUST BE >= hired count
-- 2 hired (from the applied pool) ← Can only hire from applied
-- 1 archived

-- First, reset all to pending
UPDATE employer_invitations
SET status = 'pending', 
    invited_at = NULL,
    responded_at = NULL
WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design');

-- Set 2 as sent (invited but not responded)
WITH sent_invites AS (
  SELECT id FROM employer_invitations
  WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design')
  ORDER BY created_at
  LIMIT 2
)
UPDATE employer_invitations
SET status = 'sent',
    invited_at = NOW() - INTERVAL '3 days'
WHERE id IN (SELECT id FROM sent_invites);

-- Set 5 as applied (responded positively) - MORE than hired count
WITH applied_invites AS (
  SELECT id FROM employer_invitations
  WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design')
    AND status = 'pending'
  ORDER BY created_at
  LIMIT 5
)
UPDATE employer_invitations
SET status = 'applied',
    invited_at = NOW() - INTERVAL '5 days',
    responded_at = NOW() - INTERVAL '2 days'
WHERE id IN (SELECT id FROM applied_invites);

-- Set 2 as hired (from the applied pool - top performers)
WITH hired_invites AS (
  SELECT id FROM employer_invitations
  WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design')
    AND status = 'applied'
  ORDER BY proficiency_pct DESC
  LIMIT 2
)
UPDATE employer_invitations
SET status = 'hired',
    responded_at = NOW() - INTERVAL '1 day'
WHERE id IN (SELECT id FROM hired_invites);

-- Set 1 as archived
WITH archived_invite AS (
  SELECT id FROM employer_invitations
  WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design')
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE employer_invitations
SET status = 'archived',
    archived_at = NOW() - INTERVAL '7 days',
    archived_by = 'employer',
    status_before_archive = 'sent'
WHERE id IN (SELECT id FROM archived_invite);

-- Verify the new distribution
SELECT 
  status,
  COUNT(*) as count,
  STRING_AGG(CONCAT(p.first_name, ' ', p.last_name), ', ') as candidates
FROM employer_invitations ei
JOIN profiles p ON p.id = ei.user_id
WHERE ei.company_id = (SELECT id FROM companies WHERE name = 'Power Design')
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'sent' THEN 2
    WHEN 'applied' THEN 3
    WHEN 'hired' THEN 4
    WHEN 'declined' THEN 5
    WHEN 'unqualified' THEN 6
    WHEN 'archived' THEN 7
  END;

-- Show the math
SELECT 
  'Pipeline Math Check' as check_name,
  (SELECT COUNT(*) FROM employer_invitations WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design') AND status = 'applied') as applications_received,
  (SELECT COUNT(*) FROM employer_invitations WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design') AND status = 'hired') as candidates_hired,
  CASE 
    WHEN (SELECT COUNT(*) FROM employer_invitations WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design') AND status = 'applied') >= 
         (SELECT COUNT(*) FROM employer_invitations WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design') AND status = 'hired')
    THEN '✓ Math checks out'
    ELSE '✗ Math is broken'
  END as status;
