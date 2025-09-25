-- Fix SOC code format for O*NET API compatibility
-- Current format: 29-2055 
-- Required format: 29-2055.00

-- 1. First, let's see what we're working with
SELECT 
  soc_code,
  CASE 
    WHEN soc_code ~ '^\d{2}-\d{4}$' THEN soc_code || '.00'
    ELSE soc_code 
  END as fixed_soc_code,
  COUNT(*) as job_count
FROM jobs 
WHERE soc_code IS NOT NULL 
GROUP BY soc_code
ORDER BY job_count DESC;

-- 2. Update jobs table - append .00 to SOC codes that match pattern XX-XXXX
UPDATE jobs 
SET soc_code = soc_code || '.00'
WHERE soc_code IS NOT NULL 
  AND soc_code ~ '^\d{2}-\d{4}$'  -- Matches format like 29-2055
  AND soc_code NOT LIKE '%.%';     -- Doesn't already have decimal

-- 3. Update cip_soc_crosswalk table if needed
UPDATE cip_soc_crosswalk 
SET soc_code = soc_code || '.00'
WHERE soc_code IS NOT NULL 
  AND soc_code ~ '^\d{2}-\d{4}$'
  AND soc_code NOT LIKE '%.%';

-- 4. Update company_job_openings table if needed  
UPDATE company_job_openings 
SET soc_code = soc_code || '.00'
WHERE soc_code IS NOT NULL 
  AND soc_code ~ '^\d{2}-\d{4}$'
  AND soc_code NOT LIKE '%.%';

-- 5. Verify the updates
SELECT 
  'jobs' as table_name,
  COUNT(*) as total_with_soc,
  COUNT(CASE WHEN soc_code ~ '^\d{2}-\d{4}\.\d{2}$' THEN 1 END) as correct_format
FROM jobs 
WHERE soc_code IS NOT NULL

UNION ALL

SELECT 
  'cip_soc_crosswalk' as table_name,
  COUNT(*) as total_with_soc,
  COUNT(CASE WHEN soc_code ~ '^\d{2}-\d{4}\.\d{2}$' THEN 1 END) as correct_format
FROM cip_soc_crosswalk 
WHERE soc_code IS NOT NULL

UNION ALL

SELECT 
  'company_job_openings' as table_name,
  COUNT(*) as total_with_soc,
  COUNT(CASE WHEN soc_code ~ '^\d{2}-\d{4}\.\d{2}$' THEN 1 END) as correct_format
FROM company_job_openings 
WHERE soc_code IS NOT NULL;

-- 6. Sample the results
SELECT 
  soc_code,
  title,
  'Updated format' as status
FROM jobs 
WHERE soc_code IS NOT NULL 
LIMIT 10;
