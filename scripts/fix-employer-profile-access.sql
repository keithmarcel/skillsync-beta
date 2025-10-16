-- Fix RLS policies so employers can read candidate profiles for invitations

-- Check current policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Drop the problematic policy
DROP POLICY IF EXISTS "Employers can view invited candidate profiles" ON profiles;

-- TEMPORARY FIX: Allow all authenticated users to read all profiles
-- This is for development/testing - you should restrict this in production
CREATE POLICY "Employers can view invited candidate profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  -- For now, allow reading profiles if the user has invitations
  visible_to_employers = true
  OR id = auth.uid()
);

-- Verify the new policy was created
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
AND policyname = 'Employers can view invited candidate profiles';
