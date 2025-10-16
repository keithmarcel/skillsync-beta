-- Add more invitations with DECLINED, HIRED, UNQUALIFIED statuses
-- Uses existing candidates with different job pairings to avoid unique constraint

DO $$
DECLARE
  power_design_id UUID;
  mech_pm_id UUID;  -- Mechanical Project Manager
  mech_asst_pm_id UUID;  -- Mechanical Assistant Project Manager
BEGIN
  -- Get Power Design company ID
  SELECT id INTO power_design_id FROM companies WHERE name = 'Power Design' LIMIT 1;
  
  -- Get the two jobs we know exist
  SELECT id INTO mech_asst_pm_id FROM jobs 
  WHERE company_id = power_design_id 
  AND title = 'Mechanical Assistant Project Manager' LIMIT 1;
  
  SELECT id INTO mech_pm_id FROM jobs 
  WHERE company_id = power_design_id 
  AND title = 'Mechanical Project Manager' LIMIT 1;
  
  -- Add DECLINED status - candidate1 for Mechanical Project Manager (different from their pending one)
  INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, invited_at, responded_at, is_read, created_at)
  SELECT power_design_id, p.id, mech_pm_id, 96, 'declined', 'https://powerdesign.com/careers/apply', 
         NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days', true, NOW() - INTERVAL '6 days'
  FROM profiles p 
  WHERE p.email = 'candidate1@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM employer_invitations ei 
    WHERE ei.user_id = p.id AND ei.job_id = mech_pm_id
  );
  
  -- Add HIRED status - candidate3 for Mechanical Project Manager (different from their pending one)
  INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, invited_at, responded_at, is_read, created_at)
  SELECT power_design_id, p.id, mech_pm_id, 97, 'hired', 'https://powerdesign.com/careers/apply',
         NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', true, NOW() - INTERVAL '12 days'
  FROM profiles p 
  WHERE p.email = 'candidate3@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM employer_invitations ei 
    WHERE ei.user_id = p.id AND ei.job_id = mech_pm_id
  );
  
  -- Add UNQUALIFIED status - candidate4 for Mechanical Project Manager (different from their pending one)
  INSERT INTO employer_invitations (company_id, user_id, job_id, proficiency_pct, status, application_url, invited_at, is_read, created_at)
  SELECT power_design_id, p.id, mech_pm_id, 85, 'unqualified', 'https://powerdesign.com/careers/apply',
         NOW() - INTERVAL '7 days', true, NOW() - INTERVAL '8 days'
  FROM profiles p 
  WHERE p.email = 'candidate4@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM employer_invitations ei 
    WHERE ei.user_id = p.id AND ei.job_id = mech_pm_id
  );
  
  RAISE NOTICE 'Added 3 more invitations with DECLINED, HIRED, UNQUALIFIED statuses';
  RAISE NOTICE 'Total invitations should now be 8 with all status scenarios covered';
END $$;

-- Verify all invitations
SELECT 
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
    WHEN ei.proficiency_pct >= 95 THEN 'Top Performer'
    ELSE ''
  END as top_performer
FROM employer_invitations ei
JOIN profiles p ON ei.user_id = p.id
JOIN jobs j ON ei.job_id = j.id
WHERE ei.company_id = (SELECT id FROM companies WHERE name = 'Power Design')
ORDER BY ei.status, ei.proficiency_pct DESC;
