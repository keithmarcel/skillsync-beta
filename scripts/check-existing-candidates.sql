-- Check all existing candidate accounts
SELECT 
  email, 
  first_name, 
  last_name,
  avatar_url,
  linkedin_url,
  visible_to_employers
FROM profiles 
WHERE email LIKE 'candidate%@test.com'
ORDER BY email;

-- Check how many jobs Power Design has
SELECT COUNT(*) as job_count, 
       string_agg(title, ', ' ORDER BY title) as job_titles
FROM jobs 
WHERE company_id = (SELECT id FROM companies WHERE name = 'Power Design');

-- Check existing invitations to avoid duplicates
SELECT 
  p.email,
  j.title as job_title,
  ei.status,
  ei.proficiency_pct
FROM employer_invitations ei
JOIN profiles p ON ei.user_id = p.id
JOIN jobs j ON ei.job_id = j.id
WHERE ei.company_id = (SELECT id FROM companies WHERE name = 'Power Design')
ORDER BY p.email, j.title;
