-- Fix avatar assignments to match gender of names
-- Assuming Avatar-1.png, Avatar-3.png, Avatar-5.png are female
-- Assuming Avatar-2.png, Avatar-4.png are male

-- Based on current avatars in the table:
-- Avatar showing for Naomi Blake (female) -> should be female avatar
-- Avatar showing for Emanuel Highgate (male) -> should be male avatar
-- They are swapped, so we need to swap them

UPDATE profiles 
SET avatar_url = '/assets/Avatar-3.png'  -- Female avatar (currently on Emanuel)
WHERE email = 'candidate1@test.com';  -- Naomi Blake (female)

UPDATE profiles 
SET avatar_url = '/assets/Avatar-2.png'  -- Male avatar
WHERE email = 'candidate2@test.com';  -- Elias Thorne (male)

UPDATE profiles 
SET avatar_url = '/assets/Avatar-1.png'  -- Male avatar (currently on Naomi)
WHERE email = 'candidate3@test.com';  -- Emanuel Highgate (male)

UPDATE profiles 
SET avatar_url = '/assets/Avatar-4.png'  -- Female avatar
WHERE email = 'candidate4@test.com';  -- Aaliyah Ramirez (female)

UPDATE profiles 
SET avatar_url = '/assets/Avatar-5.png'  -- Female avatar
WHERE email = 'candidate5@test.com';  -- Fatima Nguyen (female)

-- Verify the updates
SELECT 
  email,
  first_name || ' ' || last_name as name,
  avatar_url,
  CASE 
    WHEN first_name IN ('Naomi', 'Aaliyah', 'Fatima') THEN 'Female'
    WHEN first_name IN ('Elias', 'Emanuel') THEN 'Male'
  END as expected_gender
FROM profiles 
WHERE email LIKE 'candidate%@test.com'
ORDER BY email;

-- Add 2 invitations for keith-woods@bisk.com
DO $$
DECLARE
  power_design_id UUID;
  keith_id UUID;
  job1_id UUID;
  job2_id UUID;
BEGIN
  -- Get Power Design company ID
  SELECT id INTO power_design_id FROM companies WHERE name = 'Power Design' LIMIT 1;
  
  -- Get Keith's user ID
  SELECT id INTO keith_id FROM profiles WHERE email = 'keith-woods@bisk.com' LIMIT 1;
  
  IF keith_id IS NULL THEN
    RAISE NOTICE 'keith-woods@bisk.com profile not found - skipping invitation creation';
    RETURN;
  END IF;
  
  -- Get 2 different jobs
  SELECT id INTO job1_id FROM jobs 
  WHERE company_id = power_design_id 
  ORDER BY title LIMIT 1;
  
  SELECT id INTO job2_id FROM jobs 
  WHERE company_id = power_design_id 
  ORDER BY title LIMIT 1 OFFSET 1;
  
  -- Fallback if only one job exists
  IF job2_id IS NULL THEN job2_id := job1_id; END IF;
  
  -- Add invitation 1: SENT status - 92% (Top Performer)
  INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, invited_at, is_read, created_at)
  VALUES (power_design_id, keith_id, job1_id, 92, 'sent', 'https://powerdesign.com/careers/apply', 
          NOW() - INTERVAL '3 days', false, NOW() - INTERVAL '4 days')
  ON CONFLICT (user_id, job_id) DO NOTHING;
  
  -- Add invitation 2: DECLINED status - 88% (Building Skills)
  INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, invited_at, responded_at, is_read, created_at)
  VALUES (power_design_id, keith_id, job2_id, 88, 'declined', 'https://powerdesign.com/careers/apply',
          NOW() - INTERVAL '7 days', NOW() - INTERVAL '4 days', true, NOW() - INTERVAL '8 days')
  ON CONFLICT (user_id, job_id) DO NOTHING;
  
  RAISE NOTICE 'Added 2 invitations for keith-woods@bisk.com';
END $$;

-- Verify Keith's invitations were added
SELECT 
  p.first_name || ' ' || p.last_name as name,
  p.email,
  j.title as role,
  ei.proficiency_pct,
  ei.status
FROM employer_invitations ei
JOIN profiles p ON ei.user_id = p.id
JOIN jobs j ON ei.job_id = j.id
WHERE p.email = 'keith-woods@bisk.com'
AND ei.company_id = (SELECT id FROM companies WHERE name = 'Power Design')
ORDER BY ei.status;
