-- Set default values for job_type and work_location_type for existing roles
-- This ensures admin editor shows current values instead of empty dropdowns

BEGIN;

-- Set default job_type to 'Full-time' for roles that don't have it set
UPDATE public.jobs
SET job_type = 'Full-time'
WHERE job_type IS NULL OR job_type = '';

-- Set default work_location_type to 'Onsite' for roles that don't have it set
UPDATE public.jobs
SET work_location_type = 'Onsite'
WHERE work_location_type IS NULL OR work_location_type = '';

-- Set default values for new roles going forward
ALTER TABLE public.jobs 
ALTER COLUMN job_type SET DEFAULT 'Full-time';

ALTER TABLE public.jobs 
ALTER COLUMN work_location_type SET DEFAULT 'Onsite';

COMMIT;
