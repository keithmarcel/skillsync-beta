-- Check what jobs exist for Power Design
SELECT 
  j.id,
  j.title,
  j.job_kind,
  j.company_id,
  c.name as company_name
FROM jobs j
LEFT JOIN companies c ON j.company_id = c.id
WHERE c.name = 'Power Design'
ORDER BY j.title;

-- Also check if Power Design company exists
SELECT id, name FROM companies WHERE name = 'Power Design';
