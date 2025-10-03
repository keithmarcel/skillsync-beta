-- Drop the duplicate policies we just created
DROP POLICY IF EXISTS "Users can view their own assessment skill results" ON assessment_skill_results;
DROP POLICY IF EXISTS "Admins can view all assessment skill results" ON assessment_skill_results;

-- The correct policy already exists from the initial schema:
-- "Users can view own assessment results"

-- Verify the remaining policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'assessment_skill_results';
