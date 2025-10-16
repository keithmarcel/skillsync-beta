-- Verify users have required fields for invite eligibility
-- According to app logic: users must have first_name, last_name, linkedin_url, and visible_to_employers = true

-- Step 1: Check profiles schema to confirm column names
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
  AND column_name IN ('first_name', 'last_name', 'linkedin_url', 'visible_to_employers')
ORDER BY column_name;

-- Step 2: Check all users who have invitations
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.linkedin_url,
  p.visible_to_employers,
  COUNT(ei.id) as invitation_count,
  CASE 
    WHEN p.first_name IS NULL OR p.first_name = '' THEN '❌ Missing first_name'
    WHEN p.last_name IS NULL OR p.last_name = '' THEN '❌ Missing last_name'
    WHEN p.linkedin_url IS NULL OR p.linkedin_url = '' THEN '❌ Missing linkedin_url'
    WHEN p.visible_to_employers IS NOT TRUE THEN '❌ Not opted in (visible_to_employers)'
    ELSE '✅ Eligible'
  END as eligibility_status
FROM profiles p
INNER JOIN employer_invitations ei ON p.id = ei.user_id
GROUP BY p.id, p.email, p.first_name, p.last_name, p.linkedin_url, p.visible_to_employers
ORDER BY invitation_count DESC;

-- Step 3: Summary of issues
SELECT 
  COUNT(*) as total_users_with_invites,
  COUNT(CASE WHEN p.first_name IS NULL OR p.first_name = '' THEN 1 END) as missing_first_name,
  COUNT(CASE WHEN p.last_name IS NULL OR p.last_name = '' THEN 1 END) as missing_last_name,
  COUNT(CASE WHEN p.linkedin_url IS NULL OR p.linkedin_url = '' THEN 1 END) as missing_linkedin,
  COUNT(CASE WHEN p.visible_to_employers IS NOT TRUE THEN 1 END) as not_opted_in,
  COUNT(CASE 
    WHEN (p.first_name IS NOT NULL AND p.first_name != '')
    AND (p.last_name IS NOT NULL AND p.last_name != '')
    AND (p.linkedin_url IS NOT NULL AND p.linkedin_url != '')
    AND p.visible_to_employers = TRUE
    THEN 1 
  END) as fully_eligible
FROM profiles p
INNER JOIN employer_invitations ei ON p.id = ei.user_id;
