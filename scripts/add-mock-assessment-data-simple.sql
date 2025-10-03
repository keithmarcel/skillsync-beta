-- Simple script to add mock assessment data for testing the homepage graph
-- Run this in your Supabase SQL Editor

-- Step 1: Find your user ID (uncomment and run this first to get your user_id)
-- SELECT id, email FROM auth.users;

-- Step 2: Replace 'YOUR_USER_ID_HERE' below with your actual user ID from Step 1
-- Then run the rest of the script

-- Create a test assessment
WITH new_assessment AS (
  INSERT INTO assessments (
    user_id,
    job_id,
    readiness_pct,
    created_at,
    updated_at
  )
  SELECT 
    'YOUR_USER_ID_HERE'::uuid, -- REPLACE THIS WITH YOUR USER ID
    (SELECT id FROM jobs LIMIT 1),
    75,
    NOW(),
    NOW()
  RETURNING id
),
-- Add 8 proficient skills (85-100%)
proficient_skills AS (
  INSERT INTO assessment_skills (assessment_id, skill_id, proficiency_pct, created_at)
  SELECT 
    (SELECT id FROM new_assessment),
    id,
    85 + floor(random() * 15)::int,
    NOW()
  FROM skills
  ORDER BY random()
  LIMIT 8
  RETURNING assessment_id
),
-- Add 5 building skills (50-79%)
building_skills AS (
  INSERT INTO assessment_skills (assessment_id, skill_id, proficiency_pct, created_at)
  SELECT 
    (SELECT id FROM new_assessment),
    id,
    50 + floor(random() * 29)::int,
    NOW()
  FROM skills
  WHERE id NOT IN (SELECT skill_id FROM assessment_skills WHERE assessment_id = (SELECT id FROM new_assessment))
  ORDER BY random()
  LIMIT 5
  RETURNING assessment_id
),
-- Add 3 developing skills (20-49%)
developing_skills AS (
  INSERT INTO assessment_skills (assessment_id, skill_id, proficiency_pct, created_at)
  SELECT 
    (SELECT id FROM new_assessment),
    id,
    20 + floor(random() * 29)::int,
    NOW()
  FROM skills
  WHERE id NOT IN (SELECT skill_id FROM assessment_skills WHERE assessment_id = (SELECT id FROM new_assessment))
  ORDER BY random()
  LIMIT 3
  RETURNING assessment_id
)
SELECT 
  'Assessment created successfully!' as message,
  (SELECT id FROM new_assessment) as assessment_id,
  '8 proficient, 5 building, 3 developing skills added' as skills_summary;
