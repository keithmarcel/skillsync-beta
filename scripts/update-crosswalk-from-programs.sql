-- Update CIP-SOC Crosswalk Based on Actual Programs
-- This script aligns the crosswalk with real program CIP codes in the database

-- Step 1: Add common business/management CIP codes for management roles
-- These are the most common CIP codes in our programs
INSERT INTO cip_soc_crosswalk (soc_code, cip_code, source, weight)
SELECT DISTINCT 
  j.soc_code,
  '52.0201' as cip_code,  -- Business Administration and Management
  'program_based' as source,
  1.0 as weight
FROM jobs j
WHERE j.soc_code LIKE '11-%'  -- Management occupations
  AND j.soc_code NOT IN (
    SELECT DISTINCT soc_code 
    FROM cip_soc_crosswalk 
    WHERE cip_code = '52.0201'
  )
ON CONFLICT (soc_code, cip_code) DO NOTHING;

-- Step 2: Add project management CIP for project manager roles
INSERT INTO cip_soc_crosswalk (soc_code, cip_code, source, weight)
SELECT DISTINCT 
  j.soc_code,
  '52.0213' as cip_code,  -- Project Management
  'program_based' as source,
  1.0 as weight
FROM jobs j
WHERE (j.title ILIKE '%project manager%' OR j.title ILIKE '%project management%')
  AND j.soc_code NOT IN (
    SELECT DISTINCT soc_code 
    FROM cip_soc_crosswalk 
    WHERE cip_code = '52.0213'
  )
ON CONFLICT (soc_code, cip_code) DO NOTHING;

-- Step 3: Add surgical tech CIP for surgical roles
INSERT INTO cip_soc_crosswalk (soc_code, cip_code, source, weight)
SELECT DISTINCT 
  j.soc_code,
  '51.0904' as cip_code,  -- Surgical Technology
  'program_based' as source,
  1.0 as weight
FROM jobs j
WHERE (j.title ILIKE '%surgical%' OR j.title ILIKE '%surgery%')
  AND j.soc_code NOT IN (
    SELECT DISTINCT soc_code 
    FROM cip_soc_crosswalk 
    WHERE cip_code = '51.0904'
  )
ON CONFLICT (soc_code, cip_code) DO NOTHING;

-- Step 4: Add property management CIP for property manager roles
INSERT INTO cip_soc_crosswalk (soc_code, cip_code, source, weight)
SELECT DISTINCT 
  j.soc_code,
  '52.0201' as cip_code,  -- Business Administration (closest match)
  'program_based' as source,
  1.0 as weight
FROM jobs j
WHERE (j.title ILIKE '%property manager%' OR j.title ILIKE '%property management%')
  AND j.soc_code NOT IN (
    SELECT DISTINCT soc_code 
    FROM cip_soc_crosswalk 
    WHERE cip_code = '52.0201'
  )
ON CONFLICT (soc_code, cip_code) DO NOTHING;

-- Step 5: Add financial/accounting CIP for financial roles
INSERT INTO cip_soc_crosswalk (soc_code, cip_code, source, weight)
SELECT DISTINCT 
  j.soc_code,
  '52.0301' as cip_code,  -- Accounting
  'program_based' as source,
  1.0 as weight
FROM jobs j
WHERE (j.title ILIKE '%financial%' OR j.title ILIKE '%accountant%' OR j.title ILIKE '%accounting%')
  AND j.soc_code NOT IN (
    SELECT DISTINCT soc_code 
    FROM cip_soc_crosswalk 
    WHERE cip_code = '52.0301'
  )
ON CONFLICT (soc_code, cip_code) DO NOTHING;

-- Step 6: Add supply chain CIP for logistics/supply chain roles
INSERT INTO cip_soc_crosswalk (soc_code, cip_code, source, weight)
SELECT DISTINCT 
  j.soc_code,
  '52.0203' as cip_code,  -- Supply Chain Management
  'program_based' as source,
  1.0 as weight
FROM jobs j
WHERE (j.title ILIKE '%supply chain%' OR j.title ILIKE '%logistics%' OR j.title ILIKE '%procurement%')
  AND j.soc_code NOT IN (
    SELECT DISTINCT soc_code 
    FROM cip_soc_crosswalk 
    WHERE cip_code = '52.0203'
  )
ON CONFLICT (soc_code, cip_code) DO NOTHING;

-- Step 7: Add HR CIP for human resources roles
INSERT INTO cip_soc_crosswalk (soc_code, cip_code, source, weight)
SELECT DISTINCT 
  j.soc_code,
  '52.1001' as cip_code,  -- Human Resources Management
  'program_based' as source,
  1.0 as weight
FROM jobs j
WHERE (j.title ILIKE '%human resource%' OR j.title ILIKE '%hr %' OR j.title ILIKE '%personnel%')
  AND j.soc_code NOT IN (
    SELECT DISTINCT soc_code 
    FROM cip_soc_crosswalk 
    WHERE cip_code = '52.1001'
  )
ON CONFLICT (soc_code, cip_code) DO NOTHING;

-- Step 8: Add IT/Computer Science CIP for tech roles
INSERT INTO cip_soc_crosswalk (soc_code, cip_code, source, weight)
SELECT DISTINCT 
  j.soc_code,
  '11.0103' as cip_code,  -- Information Technology
  'program_based' as source,
  1.0 as weight
FROM jobs j
WHERE (j.title ILIKE '%software%' OR j.title ILIKE '%developer%' OR j.title ILIKE '%programmer%' OR j.title ILIKE '%IT %')
  AND j.soc_code NOT IN (
    SELECT DISTINCT soc_code 
    FROM cip_soc_crosswalk 
    WHERE cip_code = '11.0103'
  )
ON CONFLICT (soc_code, cip_code) DO NOTHING;

-- Step 9: Remove obsolete NCES mappings that have no programs
DELETE FROM cip_soc_crosswalk
WHERE source = 'NCES'
  AND cip_code NOT IN (
    SELECT DISTINCT cip_code 
    FROM programs 
    WHERE status = 'published' 
      AND cip_code IS NOT NULL
  );

-- Show results
SELECT 
  'Crosswalk updated!' as message,
  COUNT(*) as total_mappings,
  COUNT(DISTINCT soc_code) as unique_socs,
  COUNT(DISTINCT cip_code) as unique_cips
FROM cip_soc_crosswalk;
