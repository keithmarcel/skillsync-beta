-- Check RLS policies on employer_invitations table
-- Verify if there's database-level protection for visible_to_employers

-- 1. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'employer_invitations';

-- 2. Check existing RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'employer_invitations'
ORDER BY policyname;

-- 3. Test query: Can we see invitations for users who haven't opted in?
SELECT 
  ei.id,
  ei.user_id,
  p.email,
  p.visible_to_employers,
  ei.status,
  CASE 
    WHEN p.visible_to_employers = false THEN '❌ SECURITY ISSUE: User not opted in but has invitation'
    ELSE '✅ OK'
  END as security_status
FROM employer_invitations ei
JOIN profiles p ON ei.user_id = p.id
WHERE p.visible_to_employers = false
LIMIT 10;
