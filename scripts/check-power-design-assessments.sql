-- Check assessments for Power Design roles

-- 1. Get Power Design's job IDs
SELECT 
  j.id,
  j.title,
  j.job_kind,
  j.company_id
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE c.name = 'Power Design'
  AND j.job_kind = 'featured_role';

-- 2. Count assessments per Power Design role
SELECT 
  j.id as job_id,
  j.title as role_title,
  COUNT(a.id) as assessment_count,
  COUNT(DISTINCT a.user_id) as unique_users
FROM jobs j
JOIN companies c ON c.id = j.company_id
LEFT JOIN assessments a ON a.job_id = j.id
WHERE c.name = 'Power Design'
  AND j.job_kind = 'featured_role'
GROUP BY j.id, j.title
ORDER BY assessment_count DESC;

-- 3. Check if there are ANY assessments in the database
SELECT COUNT(*) as total_assessments FROM assessments;

-- 4. Check assessments with job_id (any company)
SELECT 
  COUNT(*) as assessments_with_job_id,
  COUNT(DISTINCT job_id) as unique_jobs,
  COUNT(DISTINCT user_id) as unique_users
FROM assessments
WHERE job_id IS NOT NULL;

-- 5. Sample of assessments (if any exist)
SELECT 
  a.id,
  a.user_id,
  a.job_id,
  a.method,
  a.readiness_pct,
  a.analyzed_at,
  j.title as job_title,
  c.name as company_name
FROM assessments a
LEFT JOIN jobs j ON j.id = a.job_id
LEFT JOIN companies c ON c.id = j.company_id
ORDER BY a.analyzed_at DESC
LIMIT 10;
