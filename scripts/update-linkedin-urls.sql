-- Update all candidate LinkedIn URLs to point to keithmarcelwoods
UPDATE profiles 
SET linkedin_url = 'https://www.linkedin.com/in/keithmarcelwoods'
WHERE email IN (
  'candidate1@test.com',
  'candidate2@test.com', 
  'candidate3@test.com',
  'candidate4@test.com',
  'candidate5@test.com'
);

-- Verify the update
SELECT 
  email,
  first_name || ' ' || last_name as name,
  linkedin_url
FROM profiles 
WHERE email LIKE 'candidate%@test.com'
ORDER BY email;
