-- Verify profiles table schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if linkedin_url exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'profiles' 
  AND column_name = 'linkedin_url'
  AND table_schema = 'public'
) as linkedin_url_exists;

-- Verify employer_invitations table schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'employer_invitations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what test candidate emails exist
SELECT email, first_name, last_name, avatar_url, linkedin_url, visible_to_employers
FROM profiles
WHERE email LIKE 'candidate%@test.com'
ORDER BY email;
