-- Create Power Design Employer Admin User
-- Run this if the employer@powerdesign.com user doesn't exist

-- NOTE: This script requires Supabase Service Role access
-- You may need to create the user through the Supabase Dashboard instead:
-- 1. Go to Authentication > Users
-- 2. Click "Add User"
-- 3. Email: employer@powerdesign.com
-- 4. Password: Password123!
-- 5. Auto Confirm User: YES

-- After creating the auth user, run this to set up the profile:

-- First, get the user ID (replace with actual ID from auth.users)
DO $$
DECLARE
  employer_user_id UUID;
  power_design_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO employer_user_id 
  FROM auth.users 
  WHERE email = 'employer@powerdesign.com';
  
  IF employer_user_id IS NULL THEN
    RAISE EXCEPTION 'User employer@powerdesign.com not found in auth.users. Please create via Supabase Dashboard first.';
  END IF;
  
  -- Get Power Design company ID
  SELECT id INTO power_design_id 
  FROM companies 
  WHERE name = 'Power Design' 
  LIMIT 1;
  
  IF power_design_id IS NULL THEN
    RAISE EXCEPTION 'Power Design company not found. Run create-companies.js first.';
  END IF;
  
  -- Create or update profile
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    company_id,
    avatar_url,
    zip_code,
    visible_to_employers,
    agreed_to_terms
  )
  VALUES (
    employer_user_id,
    'employer@powerdesign.com',
    'Sarah',
    'Mitchell',
    'org_user',  -- or 'partner_admin' depending on your role enum
    power_design_id,
    '/assets/Avatar.png',
    '33701',
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    avatar_url = EXCLUDED.avatar_url;
  
  RAISE NOTICE 'Profile created/updated for employer@powerdesign.com';
  RAISE NOTICE 'User ID: %', employer_user_id;
  RAISE NOTICE 'Company ID: %', power_design_id;
END $$;

-- Verify the setup
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  c.name as company_name
FROM profiles p
JOIN companies c ON p.company_id = c.id
WHERE p.email = 'employer@powerdesign.com';
