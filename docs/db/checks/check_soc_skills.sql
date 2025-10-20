-- Check skills from soc_skills table for Administrative Assistant SOC code
SELECT 
  ss.soc_code,
  s.id as skill_id,
  s.name as skill_name,
  s.category as skill_category,
  ss.weight
FROM soc_skills ss
JOIN skills s ON ss.skill_id = s.id
WHERE ss.soc_code = '43-6014.00'
ORDER BY ss.weight DESC;
