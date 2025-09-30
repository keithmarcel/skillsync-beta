-- Clean slate: Remove all skills and job-skill relationships
-- This will clear any mock data and prepare for fresh O*NET population

-- 1. First, remove all job-skill relationships
DELETE FROM job_skills;

-- 2. Remove all skills (this will cascade to any remaining relationships)
DELETE FROM skills;

-- 3. Reset any auto-increment sequences if they exist
-- (PostgreSQL uses sequences for serial columns, but skills uses UUID so this may not be needed)

-- 4. Verify cleanup
SELECT 
  'skills' as table_name,
  COUNT(*) as remaining_records
FROM skills

UNION ALL

SELECT 
  'job_skills' as table_name,
  COUNT(*) as remaining_records  
FROM job_skills

UNION ALL

SELECT 
  'jobs_with_soc' as table_name,
  COUNT(*) as remaining_records
FROM jobs 
WHERE soc_code IS NOT NULL;

-- 5. Show sample jobs that will be processed
SELECT 
  soc_code,
  title,
  'Ready for O*NET population' as status
FROM jobs 
WHERE soc_code IS NOT NULL 
ORDER BY soc_code
LIMIT 10;
