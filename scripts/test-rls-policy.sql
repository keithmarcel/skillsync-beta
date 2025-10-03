-- Test if RLS is blocking assessment_skill_results
-- This simulates what the authenticated user would see

-- First, check what user we're testing with
SELECT 
    'Current user:' as info,
    auth.uid() as user_id;

-- Check assessments for this user
SELECT 
    'User assessments:' as info,
    id,
    user_id,
    method
FROM assessments 
WHERE user_id = auth.uid()
LIMIT 3;

-- Check if we can see assessment_skill_results through the RLS policy
SELECT 
    'Skill results (through RLS):' as info,
    asr.assessment_id,
    asr.skill_id,
    asr.band,
    asr.score_pct
FROM assessment_skill_results asr
WHERE asr.assessment_id IN (
    SELECT id FROM assessments WHERE user_id = auth.uid()
)
LIMIT 5;

-- Check the RLS policies on assessment_skill_results
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'assessment_skill_results';
