-- Employer Dashboard Metrics Query
-- Based on actual schema - no more errors!

-- Get Power Design's company ID first
WITH company_info AS (
  SELECT id, name, logo_url, hq_city, hq_state, industry
  FROM companies
  WHERE name = 'Power Design'
)

-- Main metrics query
SELECT 
  -- Company info
  c.name as company_name,
  c.logo_url,
  c.hq_city,
  c.hq_state,
  
  -- Role metrics
  (SELECT COUNT(*) 
   FROM jobs 
   WHERE company_id = c.id 
   AND job_kind = 'featured_role' 
   AND is_published = true) as active_roles,
   
  (SELECT COUNT(*) 
   FROM jobs 
   WHERE company_id = c.id 
   AND job_kind = 'featured_role' 
   AND (is_published = false OR status = 'draft')) as draft_roles,
   
  -- Candidate pipeline metrics
  (SELECT COUNT(*) 
   FROM employer_invitations 
   WHERE company_id = c.id) as total_candidates,
   
  (SELECT COUNT(*) 
   FROM employer_invitations 
   WHERE company_id = c.id 
   AND status = 'pending') as pending_to_invite,
   
  (SELECT COUNT(*) 
   FROM employer_invitations 
   WHERE company_id = c.id 
   AND status = 'sent') as invitations_sent,
   
  (SELECT COUNT(*) 
   FROM employer_invitations 
   WHERE company_id = c.id 
   AND status = 'applied') as applications_received,
   
  (SELECT COUNT(*) 
   FROM employer_invitations 
   WHERE company_id = c.id 
   AND status = 'hired') as candidates_hired,
   
  (SELECT COUNT(*) 
   FROM employer_invitations 
   WHERE company_id = c.id 
   AND status = 'unqualified') as marked_unqualified,
   
  -- Recent activity (last 7 days)
  (SELECT COUNT(*) 
   FROM employer_invitations 
   WHERE company_id = c.id 
   AND created_at >= NOW() - INTERVAL '7 days') as new_candidates_7d,
   
  (SELECT COUNT(*) 
   FROM employer_invitations 
   WHERE company_id = c.id 
   AND status = 'applied'
   AND responded_at >= NOW() - INTERVAL '7 days') as new_applications_7d,
   
  -- Unread notifications
  (SELECT COUNT(*) 
   FROM employer_invitations 
   WHERE company_id = c.id 
   AND is_read_by_employer = false
   AND status IN ('applied', 'declined')) as unread_responses

FROM company_info c;


-- Breakdown by role
SELECT 
  j.id,
  j.title,
  j.category,
  j.is_published,
  j.status,
  COUNT(ei.id) as candidate_count,
  COUNT(CASE WHEN ei.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN ei.status = 'sent' THEN 1 END) as invited_count,
  COUNT(CASE WHEN ei.status = 'applied' THEN 1 END) as applied_count,
  COUNT(CASE WHEN ei.status = 'hired' THEN 1 END) as hired_count
FROM jobs j
LEFT JOIN employer_invitations ei ON ei.job_id = j.id
WHERE j.company_id = (SELECT id FROM companies WHERE name = 'Power Design')
  AND j.job_kind = 'featured_role'
GROUP BY j.id, j.title, j.category, j.is_published, j.status
ORDER BY candidate_count DESC;


-- Recent candidate activity (for activity feed)
SELECT 
  ei.id,
  ei.status,
  ei.proficiency_pct,
  ei.created_at,
  ei.invited_at,
  ei.responded_at,
  ei.is_read_by_employer,
  p.first_name,
  p.last_name,
  p.avatar_url,
  j.title as role_title,
  j.id as role_id
FROM employer_invitations ei
JOIN profiles p ON p.id = ei.user_id
JOIN jobs j ON j.id = ei.job_id
WHERE ei.company_id = (SELECT id FROM companies WHERE name = 'Power Design')
ORDER BY 
  CASE 
    WHEN ei.responded_at IS NOT NULL THEN ei.responded_at
    WHEN ei.invited_at IS NOT NULL THEN ei.invited_at
    ELSE ei.created_at
  END DESC
LIMIT 10;
