-- FIX: Enforce visible_to_employers check for invitation access
-- This prevents users from seeing/responding to invitations if they haven't opted in

-- Step 1: Drop the existing "Users can view own invitations" policy
DROP POLICY IF EXISTS "Users can view own invitations" ON employer_invitations;

-- Step 2: Create new policy that checks BOTH user_id AND visible_to_employers
CREATE POLICY "Users can view own invitations if opted in"
ON employer_invitations
FOR SELECT
TO public
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.visible_to_employers = true
  )
);

-- Step 3: Drop the existing "Users can update own invitations" policy
DROP POLICY IF EXISTS "Users can update own invitations" ON employer_invitations;

-- Step 4: Create new policy that checks BOTH user_id AND visible_to_employers
CREATE POLICY "Users can update own invitations if opted in"
ON employer_invitations
FOR UPDATE
TO public
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.visible_to_employers = true
  )
);

-- Step 5: Add policy to prevent invitation creation for non-opted-in users
DROP POLICY IF EXISTS "Employer admins can create invitations" ON employer_invitations;

CREATE POLICY "Employer admins can create invitations for opted-in users"
ON employer_invitations
FOR INSERT
TO public
WITH CHECK (
  -- Employer must be admin of the company
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'employer_admin' 
    AND profiles.company_id = employer_invitations.company_id
  )
  -- AND candidate must be opted in
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = employer_invitations.user_id 
    AND profiles.visible_to_employers = true
  )
);

-- Verify the new policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'employer_invitations'
AND policyname LIKE '%opted in%'
ORDER BY policyname;

-- Test: Check if any existing invitations violate the new policy
SELECT 
  COUNT(*) as violation_count,
  STRING_AGG(DISTINCT p.email, ', ') as affected_users
FROM employer_invitations ei
JOIN profiles p ON ei.user_id = p.id
WHERE p.visible_to_employers = false;
