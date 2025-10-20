-- Check Administrative Assistant role details
SELECT id, title, soc_code, company_id 
FROM jobs 
WHERE id = '271145ff-1ce0-4767-ac14-517479e38fe0';

-- Check what skills are in soc_skills for this SOC code
SELECT 
  ss.soc_code,
  ss.skill_id,
  s.name as skill_name,
  ss.weight,
  ss.display_order
FROM soc_skills ss
JOIN skills s ON s.id = ss.skill_id
WHERE ss.soc_code = '43-6014.00'
ORDER BY ss.weight DESC;

-- Check if any of the problem skill IDs exist in soc_skills
SELECT 
  skill_id,
  soc_code,
  weight
FROM soc_skills
WHERE soc_code = '43-6014.00'
AND skill_id IN (
  '8873710a-0048-40fb-80b6-ffbe2157ace9',
  '2bfeba16-1a72-4748-bcf9-61e56ce64a26',
  'edbb62ed-9426-4f55-b285-15424ea168dc'
);

-- Check if these skills exist at all
SELECT id, name, category
FROM skills
WHERE id IN (
  '8873710a-0048-40fb-80b6-ffbe2157ace9',
  '2bfeba16-1a72-4748-bcf9-61e56ce64a26',
  'edbb62ed-9426-4f55-b285-15424ea168dc'
);
