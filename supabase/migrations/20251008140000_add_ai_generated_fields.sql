-- Add AI-generated fields to jobs table
-- These fields will be populated by admin tools using OpenAI

BEGIN;

-- Add core_responsibilities field (array of text)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS core_responsibilities text[];

-- Add related_job_titles field (array of text)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS related_job_titles text[];

-- Add comments for documentation
COMMENT ON COLUMN public.jobs.core_responsibilities IS 'AI-generated core responsibilities for the occupation';
COMMENT ON COLUMN public.jobs.related_job_titles IS 'AI-generated related job titles for the occupation';

COMMIT;
