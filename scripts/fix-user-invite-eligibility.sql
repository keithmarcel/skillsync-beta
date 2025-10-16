-- Fix user profiles to make them invite-eligible
-- Adds first_name, last_name, linkedin_url, and sets visible_to_employers = true

-- Update test users (candidate1-5) with proper information
UPDATE profiles
SET 
  first_name = 'Candidate',
  last_name = 'One',
  linkedin_url = 'https://www.linkedin.com/in/candidate-one',
  visible_to_employers = true
WHERE email = 'candidate1@test.com';

UPDATE profiles
SET 
  first_name = 'Candidate',
  last_name = 'Two',
  linkedin_url = 'https://www.linkedin.com/in/candidate-two',
  visible_to_employers = true
WHERE email = 'candidate2@test.com';

UPDATE profiles
SET 
  first_name = 'Candidate',
  last_name = 'Three',
  linkedin_url = 'https://www.linkedin.com/in/candidate-three',
  visible_to_employers = true
WHERE email = 'candidate3@test.com';

UPDATE profiles
SET 
  first_name = 'Candidate',
  last_name = 'Four',
  linkedin_url = 'https://www.linkedin.com/in/candidate-four',
  visible_to_employers = true
WHERE email = 'candidate4@test.com';

UPDATE profiles
SET 
  first_name = 'Candidate',
  last_name = 'Five',
  linkedin_url = 'https://www.linkedin.com/in/candidate-five',
  visible_to_employers = true
WHERE email = 'candidate5@test.com';

-- Update Keith Woods if needed
UPDATE profiles
SET 
  first_name = COALESCE(NULLIF(first_name, ''), 'Keith'),
  last_name = COALESCE(NULLIF(last_name, ''), 'Woods'),
  linkedin_url = COALESCE(NULLIF(linkedin_url, ''), 'https://www.linkedin.com/in/keith-woods'),
  visible_to_employers = true
WHERE email = 'keith-woods@bisk.com';

-- Update me@keithmarcel.com if needed
UPDATE profiles
SET 
  first_name = COALESCE(NULLIF(first_name, ''), 'Keith'),
  last_name = COALESCE(NULLIF(last_name, ''), 'Marcel'),
  linkedin_url = COALESCE(NULLIF(linkedin_url, ''), 'https://www.linkedin.com/in/keithmarcel'),
  visible_to_employers = true
WHERE email = 'me@keithmarcel.com';

-- Verify the updates
SELECT 
  email,
  first_name,
  last_name,
  linkedin_url,
  visible_to_employers,
  CASE 
    WHEN (first_name IS NOT NULL AND first_name != '')
    AND (last_name IS NOT NULL AND last_name != '')
    AND (linkedin_url IS NOT NULL AND linkedin_url != '')
    AND visible_to_employers = TRUE
    THEN '✅ Eligible'
    ELSE '❌ Not Eligible'
  END as status
FROM profiles
WHERE email IN (
  'candidate1@test.com',
  'candidate2@test.com',
  'candidate3@test.com',
  'candidate4@test.com',
  'candidate5@test.com',
  'keith-woods@bisk.com',
  'me@keithmarcel.com'
)
ORDER BY email;
