-- Check if Power Design employer user exists

-- 1. Check auth.users table for employer@powerdesign.com
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'employer@powerdesign.com';

-- 2. Check profiles table
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  company_id
FROM profiles 
WHERE email = 'employer@powerdesign.com';

-- 3. Check if Power Design company exists
SELECT 
  id,
  name,
  is_trusted_partner,
  hq_city,
  hq_state
FROM companies 
WHERE name = 'Power Design';

-- 4. Check all employer/admin users
SELECT 
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.role IN ('employer_admin', 'org_user', 'partner_admin', 'super_admin')
ORDER BY p.email;

-- 5. List all users (first 10)
SELECT 
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;
