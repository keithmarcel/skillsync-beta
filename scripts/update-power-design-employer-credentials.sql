-- Update Power Design Employer Admin Credentials
-- New credentials:
-- Email: employeradmin-powerdesign@skillsync.com
-- Password: ssbipass

-- First, check if user already exists and delete if needed
DO $$
DECLARE
  existing_user_id UUID;
BEGIN
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'employeradmin-powerdesign@skillsync.com';
  
  IF existing_user_id IS NOT NULL THEN
    -- Delete profile first (foreign key constraint)
    DELETE FROM profiles WHERE id = existing_user_id;
    -- Delete auth user
    DELETE FROM auth.users WHERE id = existing_user_id;
    RAISE NOTICE 'Deleted existing user';
  END IF;
END $$;

-- Create the new auth user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'employeradmin-powerdesign@skillsync.com',
  crypt('ssbipass', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  FALSE,
  NULL
);

-- Now create the profile
DO $$
DECLARE
  employer_user_id UUID;
  power_design_id UUID;
  old_user_id UUID;
BEGIN
  -- Get the NEW user ID
  SELECT id INTO employer_user_id 
  FROM auth.users 
  WHERE email = 'employeradmin-powerdesign@skillsync.com';
  
  IF employer_user_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create user';
  END IF;
  
  -- Get Power Design company ID
  SELECT id INTO power_design_id 
  FROM companies 
  WHERE name = 'Power Design' 
  LIMIT 1;
  
  IF power_design_id IS NULL THEN
    RAISE EXCEPTION 'Power Design company not found.';
  END IF;
  
  -- Get old user ID (if exists)
  SELECT id INTO old_user_id
  FROM profiles
  WHERE email IN ('employer@powerdesign.com', 'keith-woods@powerdesign.com')
    AND company_id = power_design_id
  LIMIT 1;
  
  -- If old profile exists, update employer_invitations to point to new user
  IF old_user_id IS NOT NULL THEN
    RAISE NOTICE 'Migrating data from old user % to new user %', old_user_id, employer_user_id;
    
    -- Note: employer_invitations don't have an employer_id, they're linked by company_id
    -- So no migration needed there
    
    -- Delete old profile
    DELETE FROM profiles WHERE id = old_user_id;
    RAISE NOTICE 'Deleted old profile';
  END IF;
  
  -- Create new profile
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
    'employeradmin-powerdesign@skillsync.com',
    'Sarah',
    'Mitchell',
    'employer_admin',  -- Changed to employer_admin role
    power_design_id,
    '/assets/Avatar.png',
    '33701',
    false,  -- Employer admins shouldn't be visible to other employers
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    avatar_url = EXCLUDED.avatar_url,
    visible_to_employers = EXCLUDED.visible_to_employers;
  
  RAISE NOTICE '✅ Profile created/updated for employeradmin-powerdesign@skillsync.com';
  RAISE NOTICE 'User ID: %', employer_user_id;
  RAISE NOTICE 'Company ID: %', power_design_id;
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Login Credentials:';
  RAISE NOTICE 'Email: employeradmin-powerdesign@skillsync.com';
  RAISE NOTICE 'Password: ssbipass';
END $$;

-- Verify the setup
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  c.name as company_name,
  c.id as company_id
FROM profiles p
JOIN companies c ON p.company_id = c.id
WHERE p.email = 'employeradmin-powerdesign@skillsync.com';
