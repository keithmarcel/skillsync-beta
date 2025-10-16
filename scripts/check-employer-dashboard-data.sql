-- Check what data is available for employer dashboard metrics
-- Run this in Supabase SQL Editor to see what we have

-- 1. Check Power Design's company data (matches admin companies schema)
SELECT 
  id,
  name,
  logo_url,
  hq_city,
  hq_state,
  industry,
  employee_range,
  is_trusted_partner,
  is_published,
  created_at
FROM companies
WHERE name = 'Power Design';

-- 2. Check Power Design's featured roles (for "Listed Roles" count)
-- Matches employer-roles-table.tsx schema
SELECT 
  id,
  title,
  short_desc,
  category,
  required_proficiency_pct,
  assessments_count,
  is_published,
  status,
  created_at,
  updated_at
FROM jobs
WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design')
  AND job_kind = 'featured_role'
ORDER BY created_at DESC;

-- 3. Check employer_invitations for Power Design (for candidate metrics)
SELECT 
  status,
  COUNT(*) as count
FROM employer_invitations
WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design')
GROUP BY status
ORDER BY status;

-- 4. Detailed invitation breakdown
SELECT 
  ei.id,
  ei.status,
  ei.proficiency_pct,
  ei.invited_at,
  ei.responded_at,
  ei.is_read_by_employer,
  p.first_name,
  p.last_name,
  j.title as role_title
FROM employer_invitations ei
JOIN profiles p ON p.id = ei.user_id
JOIN jobs j ON j.id = ei.job_id
WHERE ei.company_id = (SELECT id FROM companies WHERE name = 'Power Design')
ORDER BY ei.created_at DESC;

-- 5. Check if we have any assessments data linked to roles
SELECT 
  j.id as job_id,
  j.title,
  COUNT(DISTINCT a.id) as assessment_count,
  COUNT(DISTINCT a.user_id) as unique_candidates
FROM jobs j
LEFT JOIN assessments a ON a.job_id = j.id
WHERE j.company_id = (SELECT id FROM companies WHERE name = 'Power Design')
  AND j.job_kind = 'featured_role'
GROUP BY j.id, j.title
ORDER BY assessment_count DESC;

-- 6. Summary metrics for dashboard
SELECT 
  (SELECT COUNT(*) FROM jobs 
   WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design') 
   AND job_kind = 'featured_role' 
   AND is_published = true) as active_roles,
   
  (SELECT COUNT(*) FROM employer_invitations 
   WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design')) as total_candidates,
   
  (SELECT COUNT(*) FROM employer_invitations 
   WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design') 
   AND status = 'pending') as pending_invites,
   
  (SELECT COUNT(*) FROM employer_invitations 
   WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design') 
   AND status = 'applied') as applications_received,
   
  (SELECT COUNT(*) FROM employer_invitations 
   WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design') 
   AND status = 'hired') as candidates_hired,
   
  (SELECT COUNT(*) FROM employer_invitations 
   WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design') 
   AND status = 'sent') as invitations_sent;
