-- Check employer_invitations structure and data for Power Design
-- This will help us understand why notifications aren't loading

-- 1. Check Power Design company ID
SELECT id, name FROM companies WHERE name = 'Power Design';

-- 2. Check employer admin profile
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  company_id
FROM profiles 
WHERE email = 'employeradmin-powerdesign@skillsync.com';

-- 3. Check employer_invitations for Power Design
SELECT 
  ei.id,
  ei.user_id,
  ei.job_id,
  ei.company_id,
  ei.status,
  ei.responded_at,
  ei.is_read_by_employer,
  p.first_name,
  p.last_name,
  j.title as job_title
FROM employer_invitations ei
LEFT JOIN profiles p ON p.id = ei.user_id
LEFT JOIN jobs j ON j.id = ei.job_id
WHERE ei.company_id = (SELECT id FROM companies WHERE name = 'Power Design' LIMIT 1)
  AND ei.status IN ('applied', 'declined')
  AND ei.responded_at IS NOT NULL
ORDER BY ei.responded_at DESC
LIMIT 10;

-- 4. Check unread count
SELECT COUNT(*) as unread_count
FROM employer_invitations
WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design' LIMIT 1)
  AND status IN ('applied', 'declined')
  AND responded_at IS NOT NULL
  AND is_read_by_employer = false;

-- 5. Check all statuses for Power Design invitations
SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN responded_at IS NOT NULL THEN 1 END) as with_response,
  COUNT(CASE WHEN is_read_by_employer = false THEN 1 END) as unread
FROM employer_invitations
WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design' LIMIT 1)
GROUP BY status
ORDER BY count DESC;
