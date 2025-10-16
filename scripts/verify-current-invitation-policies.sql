-- Verify current invitation RLS policies to see if opt-in is enforced

SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%visible_to_employers%' OR with_check LIKE '%visible_to_employers%' THEN '✅ Checks opt-in'
    ELSE '❌ No opt-in check'
  END as has_optin_check,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'employer_invitations'
ORDER BY cmd, policyname;
