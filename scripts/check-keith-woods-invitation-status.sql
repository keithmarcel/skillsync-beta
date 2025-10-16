-- Check Keith Woods' invitation status for Mechanical Assistant Project Manager at Power Design

SELECT 
  ei.id,
  ei.status,
  ei.status_before_archive,
  ei.responded_at,
  ei.is_read_by_employer,
  p.first_name,
  p.last_name,
  p.email,
  j.title as job_title,
  c.name as company_name,
  ei.proficiency_pct,
  ei.created_at,
  ei.updated_at
FROM employer_invitations ei
JOIN profiles p ON p.id = ei.user_id
JOIN jobs j ON j.id = ei.job_id
JOIN companies c ON c.id = ei.company_id
WHERE p.email = 'keith-woods@bisk.com'
  AND j.title LIKE '%Mechanical Assistant Project Manager%'
  AND c.name = 'Power Design'
ORDER BY ei.updated_at DESC;
