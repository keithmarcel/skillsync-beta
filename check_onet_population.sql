-- Check if O*NET skills were populated
-- Run these queries in your Supabase SQL Editor

-- 1. Count total skills by source
SELECT 
  source,
  COUNT(*) as skill_count
FROM skills 
GROUP BY source 
ORDER BY skill_count DESC;

-- 2. Show recent O*NET skills (last 50)
SELECT 
  name,
  category,
  source,
  onet_id,
  created_at
FROM skills 
WHERE source = 'ONET'
ORDER BY created_at DESC 
LIMIT 50;

-- 3. Count job-skill relationships
SELECT COUNT(*) as total_job_skill_relationships
FROM job_skills;

-- 4. Show jobs with their skill counts
SELECT 
  j.soc_code,
  j.title,
  COUNT(js.skill_id) as skills_count,
  STRING_AGG(s.name, ', ' ORDER BY s.name) as skill_names
FROM jobs j
LEFT JOIN job_skills js ON j.id = js.job_id
LEFT JOIN skills s ON js.skill_id = s.id
WHERE j.soc_code IS NOT NULL
GROUP BY j.id, j.soc_code, j.title
ORDER BY skills_count DESC
LIMIT 20;

-- 5. Check for recent activity (skills created in last hour)
SELECT 
  COUNT(*) as recent_skills_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM skills 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 6. Sample O*NET skills with details
SELECT 
  name,
  description,
  category,
  onet_id,
  created_at
FROM skills 
WHERE source = 'ONET' 
  AND name IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Job-skill relationships with skill details
SELECT 
  j.soc_code,
  j.title as job_title,
  s.name as skill_name,
  s.category as skill_category,
  js.importance_level,
  js.proficiency_threshold
FROM job_skills js
JOIN jobs j ON js.job_id = j.id
JOIN skills s ON js.skill_id = s.id
WHERE s.source = 'ONET'
ORDER BY j.soc_code, js.importance_level DESC
LIMIT 30;
