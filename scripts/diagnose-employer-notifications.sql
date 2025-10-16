-- Diagnostic Query for Employer Notifications Issue
-- Run this to understand why Power Design isn't seeing notifications

-- 1. Check if is_read_by_employer column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'employer_invitations'
  AND column_name = 'is_read_by_employer';
-- Expected: Should return one row if migration was run

-- 2. Find Power Design's company_id
SELECT id, name 
FROM companies 
WHERE name ILIKE '%power design%';
-- Note the company_id for next queries

-- 3. Check all Power Design invitations (replace YOUR_COMPANY_ID with actual ID)
SELECT 
  ei.id,
  ei.status,
  ei.invited_at,
  ei.responded_at,
  ei.is_read,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'employer_invitations' 
      AND column_name = 'is_read_by_employer'
    ) THEN ei.is_read_by_employer
    ELSE NULL
  END as is_read_by_employer,
  p.first_name || ' ' || p.last_name as candidate_name,
  j.title as job_title
FROM employer_invitations ei
JOIN profiles p ON ei.user_id = p.id
JOIN jobs j ON ei.job_id = j.id
WHERE ei.company_id = 'YOUR_COMPANY_ID'  -- Replace with Power Design's ID
ORDER BY ei.created_at DESC;

-- 4. Check specifically for applied/declined with responded_at
SELECT 
  ei.id,
  ei.status,
  ei.responded_at,
  p.first_name || ' ' || p.last_name as candidate_name,
  j.title as job_title
FROM employer_invitations ei
JOIN profiles p ON ei.user_id = p.id
JOIN jobs j ON ei.job_id = j.id
WHERE ei.company_id = 'YOUR_COMPANY_ID'  -- Replace with Power Design's ID
  AND ei.status IN ('applied', 'declined')
  AND ei.responded_at IS NOT NULL
ORDER BY ei.responded_at DESC;

-- 5. Check what the job seeker sees (invitations with status='sent')
SELECT 
  ei.id,
  c.name as company_name,
  j.title as job_title,
  ei.status,
  ei.invited_at,
  ei.is_read,
  p.first_name || ' ' || p.last_name as candidate_name
FROM employer_invitations ei
JOIN companies c ON ei.company_id = c.id
JOIN jobs j ON ei.job_id = j.id
JOIN profiles p ON ei.user_id = p.id
WHERE c.name ILIKE '%power design%'
  AND ei.status = 'sent'
ORDER BY ei.invited_at DESC;

-- DIAGNOSIS:
-- If query #1 returns nothing → Migration not run yet
-- If query #4 returns nothing → No candidates have responded yet (status still 'sent', no responded_at)
-- If query #5 shows invitations → Job seekers see them, but haven't responded yet
