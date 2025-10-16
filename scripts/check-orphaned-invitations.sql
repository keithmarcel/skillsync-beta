-- Check for orphaned invitations (user_id doesn't exist in profiles)
-- This would prevent the foreign key from being created

SELECT 
  ei.id,
  ei.user_id,
  ei.company_id,
  ei.job_id,
  ei.status,
  CASE 
    WHEN p.id IS NULL THEN 'ORPHANED - user not in profiles'
    ELSE 'OK'
  END as user_status,
  CASE 
    WHEN au.id IS NULL THEN 'ORPHANED - user not in auth.users'
    ELSE 'OK'
  END as auth_status
FROM employer_invitations ei
LEFT JOIN profiles p ON ei.user_id = p.id
LEFT JOIN auth.users au ON ei.user_id = au.id
WHERE p.id IS NULL OR au.id IS NULL
LIMIT 20;

-- Count total orphaned records
SELECT 
  COUNT(*) as total_orphaned,
  COUNT(CASE WHEN p.id IS NULL THEN 1 END) as missing_profile,
  COUNT(CASE WHEN au.id IS NULL THEN 1 END) as missing_auth_user
FROM employer_invitations ei
LEFT JOIN profiles p ON ei.user_id = p.id
LEFT JOIN auth.users au ON ei.user_id = au.id
WHERE p.id IS NULL OR au.id IS NULL;
