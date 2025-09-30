-- Fix admin access for current user
-- Run this to check your current user's admin role

-- 1. Check current user's profile and admin role
SELECT 
  id,
  email,
  admin_role,
  school_id,
  company_id
FROM profiles
WHERE id = auth.uid();

-- 2. If admin_role is NULL, set it to super_admin (for Keith)
-- UNCOMMENT AND RUN THIS IF YOUR admin_role IS NULL:
-- UPDATE profiles 
-- SET admin_role = 'super_admin'
-- WHERE id = auth.uid();

-- 3. Verify the update worked
SELECT 
  id,
  email,
  admin_role,
  school_id,
  company_id
FROM profiles
WHERE id = auth.uid();

-- 4. Test if you can now update programs
-- This should return the program if permissions are correct
SELECT id, name, is_featured 
FROM programs 
WHERE id = (SELECT id FROM programs LIMIT 1);
