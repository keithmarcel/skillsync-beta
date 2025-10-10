-- Add work_location_type column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS work_location_type TEXT 
CHECK (work_location_type IN ('Onsite', 'Remote', 'Hybrid', NULL));

-- Add comment
COMMENT ON COLUMN public.jobs.work_location_type IS 'Work arrangement: Onsite, Remote, or Hybrid';

-- Randomly populate for existing featured roles
UPDATE public.jobs
SET work_location_type = (
  CASE floor(random() * 3)::int
    WHEN 0 THEN 'Onsite'
    WHEN 1 THEN 'Remote'
    WHEN 2 THEN 'Hybrid'
  END
)
WHERE job_kind = 'featured_role' 
AND work_location_type IS NULL;

-- Show results
SELECT 
  title,
  work_location_type,
  job_type,
  location_city || ', ' || location_state as location
FROM public.jobs
WHERE job_kind = 'featured_role'
ORDER BY title;
