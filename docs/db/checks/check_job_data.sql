-- Check what data is actually in the jobs table for Administrative Assistant
SELECT 
  id, 
  title, 
  job_type, 
  work_location_type, 
  median_wage_usd,
  location_city,
  location_state,
  education_level
FROM jobs 
WHERE title ILIKE '%Administrative Assistant%' 
LIMIT 3;
