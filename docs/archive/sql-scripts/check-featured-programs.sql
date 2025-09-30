-- Check featured programs in database
SELECT 
  id, 
  program_id,
  name, 
  is_featured,
  catalog_provider,
  status
FROM programs 
WHERE is_featured = true
ORDER BY name;

-- Check RLS policies on programs table
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
WHERE tablename = 'programs';
