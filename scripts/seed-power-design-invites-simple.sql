-- Simple Power Design Invitations Seed
-- Creates test invitations using Keith Woods as the candidate
-- This will populate the employer invites table for QA

-- Get Power Design company ID and test user IDs
DO $$
DECLARE
  power_design_id UUID;
  user1_id UUID;  -- candidate1@test.com
  user2_id UUID;  -- candidate2@test.com
  user3_id UUID;  -- candidate3@test.com
  user4_id UUID;  -- candidate4@test.com
  user5_id UUID;  -- candidate5@test.com
  keith_id UUID;  -- keith-woods@bisk.com
  me_id UUID;     -- me@keithmarcel.com
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
  
  -- Get test user IDs
  SELECT id INTO user1_id FROM auth.users WHERE email = 'candidate1@test.com' LIMIT 1;
  SELECT id INTO user2_id FROM auth.users WHERE email = 'candidate2@test.com' LIMIT 1;
  SELECT id INTO user3_id FROM auth.users WHERE email = 'candidate3@test.com' LIMIT 1;
  SELECT id INTO user4_id FROM auth.users WHERE email = 'candidate4@test.com' LIMIT 1;
  SELECT id INTO user5_id FROM auth.users WHERE email = 'candidate5@test.com' LIMIT 1;
  SELECT id INTO keith_id FROM auth.users WHERE email = 'keith-woods@bisk.com' LIMIT 1;
  SELECT id INTO me_id FROM auth.users WHERE email = 'me@keithmarcel.com' LIMIT 1;
  
  -- Get job IDs
  SELECT id INTO mech_assistant_pm_id FROM jobs 
  WHERE title = 'Mechanical Assistant Project Manager' 
  AND company_id = power_design_id LIMIT 1;
  
  SELECT id INTO project_mgmt_spec_id FROM jobs 
  WHERE title = 'Project Management Specialists' 
  AND company_id = power_design_id LIMIT 1;
  
  SELECT id INTO business_dev_mgr_id FROM jobs 
  WHERE title = 'Business Development Manager' 
  AND company_id = power_design_id LIMIT 1;
  
  SELECT id INTO senior_mech_pm_id FROM jobs 
  WHERE title = 'Senior Mechanical Project Manager' 
  AND company_id = power_design_id LIMIT 1;
  
  RAISE NOTICE 'Power Design ID: %', power_design_id;
  RAISE NOTICE 'Test Users: %, %, %, %, %, %, %', user1_id, user2_id, user3_id, user4_id, user5_id, keith_id, me_id;
  RAISE NOTICE 'Jobs found: %, %, %, %', mech_assistant_pm_id, project_mgmt_spec_id, business_dev_mgr_id, senior_mech_pm_id;
  
  -- Clear existing Power Design invitations
  DELETE FROM employer_invitations WHERE company_id = power_design_id;
  
  -- Create 9 test invitations with varied statuses and different candidates
  
  -- 1. candidate1 - PENDING - 99% proficiency (Top Performer)
  IF mech_assistant_pm_id IS NOT NULL AND user1_id IS NOT NULL THEN
    INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, created_at)
    VALUES (power_design_id, user1_id, mech_assistant_pm_id, 99, 'pending', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '3 days');
  END IF;
  
  -- 2. candidate2 - SENT - 98% proficiency (Top Performer)
  IF project_mgmt_spec_id IS NOT NULL AND user2_id IS NOT NULL THEN
    INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, invited_at, is_read, created_at)
    VALUES (power_design_id, user2_id, project_mgmt_spec_id, 98, 'sent', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '2 days', false, NOW() - INTERVAL '3 days');
  END IF;
  
  -- 3. candidate3 - SENT - 95% proficiency (Top Performer)
  IF mech_assistant_pm_id IS NOT NULL AND user3_id IS NOT NULL THEN
    INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, invited_at, is_read, created_at)
    VALUES (power_design_id, user3_id, mech_assistant_pm_id, 95, 'sent', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '1 day', false, NOW() - INTERVAL '2 days');
  END IF;
  
  -- 4. candidate4 - PENDING - 91% proficiency
  IF mech_assistant_pm_id IS NOT NULL AND user4_id IS NOT NULL THEN
    INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, created_at)
    VALUES (power_design_id, user4_id, mech_assistant_pm_id, 91, 'pending', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '2 days');
  END IF;
  
  -- 5. candidate5 - PENDING - 87% proficiency
  IF project_mgmt_spec_id IS NOT NULL AND user5_id IS NOT NULL THEN
    INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, created_at)
    VALUES (power_design_id, user5_id, project_mgmt_spec_id, 87, 'pending', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '1 day');
  END IF;
  
  -- 6. Keith Woods - PENDING - 82% proficiency
  IF business_dev_mgr_id IS NOT NULL AND keith_id IS NOT NULL THEN
    INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, created_at)
    VALUES (power_design_id, keith_id, business_dev_mgr_id, 82, 'pending', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '1 day');
  END IF;
  
  -- 7. me@keithmarcel.com - SENT - 80% proficiency
  IF senior_mech_pm_id IS NOT NULL AND me_id IS NOT NULL THEN
    INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, invited_at, is_read, created_at)
    VALUES (power_design_id, me_id, senior_mech_pm_id, 80, 'sent', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '12 hours', true, NOW() - INTERVAL '2 days');
  END IF;
  
  -- 8. candidate1 (different role) - SENT - 80% proficiency
  IF senior_mech_pm_id IS NOT NULL AND user1_id IS NOT NULL THEN
    INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, invited_at, is_read, created_at)
    VALUES (power_design_id, user1_id, senior_mech_pm_id, 80, 'sent', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '6 hours', false, NOW() - INTERVAL '2 days');
  END IF;
  
  -- 9. candidate2 (different role) - PENDING - 80% proficiency
  IF mech_assistant_pm_id IS NOT NULL AND user2_id IS NOT NULL THEN
    INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, created_at)
    VALUES (power_design_id, user2_id, mech_assistant_pm_id, 80, 'pending', 'https://powerdesign.com/careers/apply', NOW() - INTERVAL '12 hours');
  END IF;
  
  RAISE NOTICE 'Created 9 test invitations for Power Design';
END $$;

-- Verify the invitations
SELECT 
  ei.id,
  p.first_name || ' ' || p.last_name as candidate_name,
  j.title as role,
  ei.proficiency_pct,
  ei.status,
  CASE 
    WHEN ei.proficiency_pct >= 90 THEN 'Ready'
    WHEN ei.proficiency_pct >= 85 THEN 'Building Skills'
    ELSE 'Needs Development'
  END as readiness,
  CASE
    WHEN ei.proficiency_pct >= (j.required_proficiency_pct + 5) THEN 'Top Performer'
    ELSE ''
  END as top_performer_badge,
  ei.created_at
FROM employer_invitations ei
JOIN profiles p ON ei.user_id = p.id
JOIN jobs j ON ei.job_id = j.id
WHERE ei.company_id = (SELECT id FROM companies WHERE name = 'Power Design' LIMIT 1)
ORDER BY ei.proficiency_pct DESC;
