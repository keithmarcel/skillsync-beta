-- Seed demo role view data for Power Design
-- Run this in Supabase SQL Editor after running the migration

-- Update views_count for Power Design roles with realistic demo data
UPDATE public.jobs
SET views_count = CASE 
  WHEN title LIKE '%Mechanical Project Manager%' AND title NOT LIKE '%Assistant%' THEN 847
  WHEN title LIKE '%Mechanical Assistant Project Manager%' THEN 623
  WHEN title LIKE '%Senior%' THEN 512
  ELSE 0
END
WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design')
  AND job_kind = 'featured_role';

-- Verify the update
SELECT 
  j.title,
  j.views_count,
  c.name as company_name
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE c.name = 'Power Design'
  AND j.job_kind = 'featured_role'
ORDER BY j.views_count DESC;

-- Show total views for Power Design
SELECT 
  c.name as company_name,
  SUM(j.views_count) as total_views,
  COUNT(j.id) as total_roles
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE c.name = 'Power Design'
  AND j.job_kind = 'featured_role'
GROUP BY c.name;
