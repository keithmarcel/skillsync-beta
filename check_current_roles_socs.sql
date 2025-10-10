-- Check all current roles and their SOC codes
SELECT 
  id,
  title,
  soc_code,
  job_kind,
  company_id,
  category
FROM jobs
WHERE is_published = true
ORDER BY job_kind, title;
