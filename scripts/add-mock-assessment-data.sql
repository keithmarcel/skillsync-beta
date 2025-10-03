-- Add mock assessment data for the current user to populate the homepage graph
-- This will create an assessment with skill proficiency data

-- First, let's get the current user's ID (replace with your actual user ID from auth.users)
-- You can find your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- For this example, we'll use a variable - replace 'YOUR_USER_ID_HERE' with your actual UUID
DO $$
DECLARE
  v_user_id uuid;
  v_job_id uuid;
  v_assessment_id uuid;
BEGIN
  -- Get the first user from auth.users (or specify your email)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- Get a sample job to associate with the assessment
  SELECT id INTO v_job_id FROM jobs LIMIT 1;
  
  -- Create an assessment if one doesn't exist
  INSERT INTO assessments (
    user_id,
    job_id,
    method,
    readiness_pct,
    status_tag,
    analyzed_at
  ) VALUES (
    v_user_id,
    v_job_id,
    'resume', -- assessment method
    75, -- 75% overall readiness
    'close_gaps', -- status tag
    NOW()
  )
  RETURNING id INTO v_assessment_id;
  
  -- If assessment already exists, get its ID
  IF v_assessment_id IS NULL THEN
    SELECT id INTO v_assessment_id 
    FROM assessments 
    WHERE user_id = v_user_id 
    ORDER BY analyzed_at DESC 
    LIMIT 1;
  END IF;
  
  -- Insert mock skill proficiency data
  -- We'll create a mix of proficient, building, and needs_dev skills
  
  -- Proficient skills (80-100%)
  INSERT INTO assessment_skill_results (assessment_id, skill_id, score_pct, band)
  SELECT 
    v_assessment_id,
    id,
    80 + (random() * 20)::int, -- Random between 80-100
    'proficient'::skill_band
  FROM skills
  WHERE id IN (
    SELECT id FROM skills ORDER BY random() LIMIT 8
  )
  ON CONFLICT (assessment_id, skill_id) DO UPDATE
  SET score_pct = EXCLUDED.score_pct, band = EXCLUDED.band;
  
  -- Building skills (50-79%)
  INSERT INTO assessment_skill_results (assessment_id, skill_id, score_pct, band)
  SELECT 
    v_assessment_id,
    id,
    50 + (random() * 29)::int, -- Random between 50-79
    'building'::skill_band
  FROM skills
  WHERE id IN (
    SELECT id FROM skills 
    WHERE id NOT IN (
      SELECT skill_id FROM assessment_skill_results WHERE assessment_id = v_assessment_id
    )
    ORDER BY random() 
    LIMIT 5
  )
  ON CONFLICT (assessment_id, skill_id) DO UPDATE
  SET score_pct = EXCLUDED.score_pct, band = EXCLUDED.band;
  
  -- Needs development skills (20-49%)
  INSERT INTO assessment_skill_results (assessment_id, skill_id, score_pct, band)
  SELECT 
    v_assessment_id,
    id,
    20 + (random() * 29)::int, -- Random between 20-49
    'needs_dev'::skill_band
  FROM skills
  WHERE id IN (
    SELECT id FROM skills 
    WHERE id NOT IN (
      SELECT skill_id FROM assessment_skill_results WHERE assessment_id = v_assessment_id
    )
    ORDER BY random() 
    LIMIT 3
  )
  ON CONFLICT (assessment_id, skill_id) DO UPDATE
  SET score_pct = EXCLUDED.score_pct, band = EXCLUDED.band;
  
  RAISE NOTICE 'Mock assessment data created successfully for user: %', v_user_id;
  RAISE NOTICE 'Assessment ID: %', v_assessment_id;
  RAISE NOTICE 'Total skills added: 16 (8 proficient, 5 building, 3 needs_dev)';
END $$;
