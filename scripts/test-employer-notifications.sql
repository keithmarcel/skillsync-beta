-- Test Employer Notifications
-- This script simulates candidates responding to invitations to test employer notifications

-- First, run the migration to add is_read_by_employer column
-- Then run this script to create test data

-- 1. Mark some existing invitations as applied/declined with responded_at timestamps
UPDATE employer_invitations 
SET 
  status = 'applied',
  responded_at = NOW() - INTERVAL '1 hour',
  is_read_by_employer = false
WHERE id IN (
  SELECT id FROM employer_invitations 
  WHERE status = 'sent' 
  LIMIT 3
);

UPDATE employer_invitations 
SET 
  status = 'declined',
  responded_at = NOW() - INTERVAL '30 minutes',
  is_read_by_employer = false
WHERE id IN (
  SELECT id FROM employer_invitations 
  WHERE status = 'sent' 
  AND id NOT IN (
    SELECT id FROM employer_invitations WHERE status = 'applied'
  )
  LIMIT 2
);

-- 2. Verify employer notifications data
SELECT 
  ei.id,
  c.name as company_name,
  j.title as job_title,
  p.first_name || ' ' || p.last_name as candidate_name,
  ei.status,
  ei.responded_at,
  ei.is_read_by_employer
FROM employer_invitations ei
JOIN companies c ON ei.company_id = c.id
JOIN jobs j ON ei.job_id = j.id
JOIN profiles p ON ei.user_id = p.id
WHERE ei.status IN ('applied', 'declined')
  AND ei.responded_at IS NOT NULL
ORDER BY ei.responded_at DESC;

-- 3. Check unread count per company
SELECT 
  c.name as company_name,
  COUNT(*) as unread_notifications
FROM employer_invitations ei
JOIN companies c ON ei.company_id = c.id
WHERE ei.status IN ('applied', 'declined')
  AND ei.responded_at IS NOT NULL
  AND ei.is_read_by_employer = false
GROUP BY c.id, c.name
ORDER BY unread_notifications DESC;
