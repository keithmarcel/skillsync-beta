-- Enhanced Power Design Invitations Seed
-- Creates test invitations with ALL status scenarios
-- Ensures all profiles have names and avatars

DO $$
DECLARE
  power_design_id UUID;
  mech_assistant_pm_id UUID;
  project_mgmt_spec_id UUID;
  business_dev_mgr_id UUID;
  senior_mech_pm_id UUID;
BEGIN
  -- Get Power Design company ID
  SELECT id INTO power_design_id FROM companies WHERE name = 'Power Design' LIMIT 1;
  
  IF power_design_id IS NULL THEN
    RAISE EXCEPTION 'Power Design company not found';
  END IF;
  
  -- Get ANY jobs for Power Design (we'll use whatever exists)
  SELECT id INTO mech_assistant_pm_id FROM jobs 
  WHERE company_id = power_design_id 
  ORDER BY title LIMIT 1;
  
  SELECT id INTO project_mgmt_spec_id FROM jobs 
  WHERE company_id = power_design_id 
  ORDER BY title LIMIT 1 OFFSET 1;
  
  SELECT id INTO business_dev_mgr_id FROM jobs 
  WHERE company_id = power_design_id 
  ORDER BY title LIMIT 1 OFFSET 2;
  
  SELECT id INTO senior_mech_pm_id FROM jobs 
  WHERE company_id = power_design_id 
  ORDER BY title LIMIT 1 OFFSET 3;
  
  -- If we don't have 4 jobs, use the first one for all
  IF project_mgmt_spec_id IS NULL THEN
    project_mgmt_spec_id := mech_assistant_pm_id;
  END IF;
  IF business_dev_mgr_id IS NULL THEN
    business_dev_mgr_id := mech_assistant_pm_id;
  END IF;
  IF senior_mech_pm_id IS NULL THEN
    senior_mech_pm_id := mech_assistant_pm_id;
  END IF;
  
  -- Clear existing Power Design invitations
  DELETE FROM employer_invitations WHERE company_id = power_design_id;
  
  -- Update test user profiles with names and avatars (using existing Avatar-X.png files)
  UPDATE profiles SET 
    first_name = 'Naomi',
    last_name = 'Blake',
    avatar_url = '/assets/Avatar-1.png',
    linkedin_url = 'https://www.linkedin.com/in/naomi-blake',
    visible_to_employers = true
  WHERE email = 'candidate1@test.com';
  
  UPDATE profiles SET 
    first_name = 'Elias',
    last_name = 'Thorne',
    avatar_url = '/assets/Avatar-2.png',
    linkedin_url = 'https://www.linkedin.com/in/elias-thorne',
    visible_to_employers = true
  WHERE email = 'candidate2@test.com';
  
  UPDATE profiles SET 
    first_name = 'Emanuel',
    last_name = 'Highgate',
    avatar_url = '/assets/Avatar-3.png',
    linkedin_url = 'https://www.linkedin.com/in/emanuel-highgate',
    visible_to_employers = true
  WHERE email = 'candidate3@test.com';
  
  UPDATE profiles SET 
    first_name = 'Aaliyah',
    last_name = 'Ramirez',
    avatar_url = '/assets/Avatar-4.png',
    linkedin_url = 'https://www.linkedin.com/in/aaliyah-ramirez',
    visible_to_employers = true
  WHERE email = 'candidate4@test.com';
  
  UPDATE profiles SET 
    first_name = 'Fatima',
    last_name = 'Nguyen',
    avatar_url = '/assets/Avatar-5.png',
    linkedin_url = 'https://www.linkedin.com/in/fatima-nguyen',
    visible_to_employers = true
  WHERE email = 'candidate5@test.com';
  
  -- Note: candidates 6-9 don't exist yet, so we'll only use candidates 1-5
  -- If you need more test data, create candidate6-9@test.com accounts first
  
  -- Create invitations with ALL status scenarios
  
  -- 1. PENDING - 99% (Top Performer) - Naomi Blake
  INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, created_at)
  SELECT power_design_id, p.id, mech_assistant_pm_id, 99, 'pending', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '3 days'
  FROM profiles p WHERE p.email = 'candidate1@test.com';
  
  -- 2. SENT (Invite Sent) - 98% (Top Performer) - Elias Thorne
  INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, invited_at, is_read, created_at)
  SELECT power_design_id, p.id, project_mgmt_spec_id, 98, 'sent', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '2 days', false, NOW() - INTERVAL '3 days'
  FROM profiles p WHERE p.email = 'candidate2@test.com';
  
  -- 3. PENDING - 95% (Top Performer) - Emanuel Highgate
  INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, created_at)
  SELECT power_design_id, p.id, mech_assistant_pm_id, 95, 'pending', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '2 days'
  FROM profiles p WHERE p.email = 'candidate3@test.com';
  
  -- 4. PENDING - 91% (Ready) - Aaliyah Ramirez
  INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, created_at)
  SELECT power_design_id, p.id, mech_assistant_pm_id, 91, 'pending', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '2 days'
  FROM profiles p WHERE p.email = 'candidate4@test.com';
  
  -- 5. APPLIED - 87% (Building Skills) - Fatima Nguyen
  INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, invited_at, responded_at, is_read, created_at)
  SELECT power_design_id, p.id, project_mgmt_spec_id, 87, 'applied', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', true, NOW() - INTERVAL '4 days'
  FROM profiles p WHERE p.email = 'candidate5@test.com';
  
  -- Note: Due to unique constraint on (user_id, job_id), we can only have ONE invitation per user per job
  -- So we're creating 5 invitations total (one per candidate) with different statuses
  
  RAISE NOTICE 'Created 5 test invitations with varied status scenarios for Power Design';
  RAISE NOTICE 'Updated 5 profiles with names, avatars, and LinkedIn URLs';
  RAISE NOTICE 'Note: Due to unique constraint (user_id, job_id), only one invitation per user-job pair is allowed';
END $$;

-- Verify the invitations
SELECT 
  ei.id,
  p.first_name || ' ' || p.last_name as candidate_name,
  p.avatar_url,
  j.title as role,
  ei.proficiency_pct,
  ei.status,
  CASE 
    WHEN ei.proficiency_pct >= 90 THEN 'Ready'
    WHEN ei.proficiency_pct >= 85 THEN 'Building Skills'
    ELSE 'Needs Development'
  END as readiness,
  CASE
    WHEN ei.proficiency_pct >= 95 THEN 'Top Performer'
    ELSE ''
  END as top_performer_badge,
  ei.created_at
FROM employer_invitations ei
JOIN profiles p ON ei.user_id = p.id
JOIN jobs j ON ei.job_id = j.id
WHERE ei.company_id = (SELECT id FROM companies WHERE name = 'Power Design' LIMIT 1)
ORDER BY ei.status, ei.proficiency_pct DESC;
