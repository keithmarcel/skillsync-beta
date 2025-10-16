-- Verify ALL candidate data including LinkedIn URLs
SELECT 
  email,
  first_name,
  last_name,
  avatar_url,
  linkedin_url,
  visible_to_employers
FROM profiles 
WHERE email IN ('candidate1@test.com', 'candidate2@test.com', 'candidate3@test.com', 
                'candidate4@test.com', 'candidate5@test.com')
ORDER BY email;

-- Check if any invitations are missing LinkedIn
SELECT 
  p.email,
  p.first_name || ' ' || p.last_name as name,
  p.linkedin_url,
  j.title,
  ei.status
FROM employer_invitations ei
JOIN profiles p ON ei.user_id = p.id
JOIN jobs j ON ei.job_id = j.id
WHERE ei.company_id = (SELECT id FROM companies WHERE name = 'Power Design')
AND (p.linkedin_url IS NULL OR p.linkedin_url = '')
ORDER BY p.email;
