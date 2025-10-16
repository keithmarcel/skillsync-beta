-- Debug Power Design Invitations
-- Check what data exists and why it's not showing

-- 1. Check Power Design company
SELECT id, name FROM companies WHERE name = 'Power Design';

-- 2. Check employer@powerdesign.com profile
SELECT 
  p.id,
  p.email,
  p.company_id,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.email = 'employer@powerdesign.com';

-- 3. Check all invitations for Power Design
SELECT 
  ei.id,
  ei.company_id,
  ei.user_id,
  ei.job_id,
  ei.status,
  ei.proficiency_pct,
  p.email as candidate_email,
  p.first_name || ' ' || p.last_name as candidate_name,
  j.title as job_title
FROM employer_invitations ei
LEFT JOIN profiles p ON ei.user_id = p.id
LEFT JOIN jobs j ON ei.job_id = j.id
WHERE ei.company_id = (SELECT id FROM companies WHERE name = 'Power Design' LIMIT 1)
ORDER BY ei.created_at DESC;

-- 4. Count invitations by status
SELECT 
  status,
  COUNT(*) as count
FROM employer_invitations
WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design' LIMIT 1)
GROUP BY status;

-- 5. Check if there are ANY invitations at all
SELECT COUNT(*) as total_invitations FROM employer_invitations;
