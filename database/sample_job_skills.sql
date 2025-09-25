-- Populate sample job-skills relationships for testing
-- This allows the quiz generation to work with existing jobs

INSERT INTO public.job_skills (job_id, skill_id, importance_level, proficiency_threshold, weight)
SELECT
  j.id as job_id,
  s.id as skill_id,
  CASE
    WHEN s.category = 'Business' THEN 'critical'::text
    WHEN s.category = 'Operations' THEN 'important'::text
    WHEN s.category = 'Analytics' THEN 'important'::text
    ELSE 'helpful'::text
  END as importance_level,
  CASE
    WHEN s.category = 'Business' THEN 85
    WHEN s.category = 'Operations' THEN 75
    WHEN s.category = 'Analytics' THEN 80
    ELSE 70
  END as proficiency_threshold,
  CASE
    WHEN s.category = 'Business' THEN 1.5
    WHEN s.category = 'Operations' THEN 1.2
    WHEN s.category = 'Analytics' THEN 1.3
    ELSE 1.0
  END as weight
FROM public.jobs j
CROSS JOIN public.skills s
WHERE j.soc_code IS NOT NULL
  AND s.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.job_skills js
    WHERE js.job_id = j.id AND js.skill_id = s.id
  )
ORDER BY j.id, s.category
LIMIT 50; -- Limit to prevent too many relationships

-- Show what we added
SELECT
  'Job-Skills Relationships Added' as status,
  COUNT(*) as total_relationships,
  COUNT(DISTINCT job_id) as jobs_with_skills,
  COUNT(DISTINCT skill_id) as skills_used
FROM public.job_skills;
