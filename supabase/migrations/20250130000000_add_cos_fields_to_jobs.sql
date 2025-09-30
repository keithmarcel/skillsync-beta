-- Add CareerOneStop enrichment fields to jobs table
-- These fields store occupation data from CareerOneStop API

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS onet_code TEXT,
ADD COLUMN IF NOT EXISTS bright_outlook TEXT,
ADD COLUMN IF NOT EXISTS bright_outlook_category TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS tasks JSONB,
ADD COLUMN IF NOT EXISTS tools_and_technology JSONB;

-- Add comments for documentation
COMMENT ON COLUMN public.jobs.onet_code IS 'O*NET code from CareerOneStop (e.g., 29-1141.00)';
COMMENT ON COLUMN public.jobs.bright_outlook IS 'CareerOneStop Bright Outlook indicator: Bright, No, or null';
COMMENT ON COLUMN public.jobs.bright_outlook_category IS 'Reason for bright outlook (e.g., Rapid Growth; Numerous Job Openings)';
COMMENT ON COLUMN public.jobs.video_url IS 'CareerOneStop occupation video URL';
COMMENT ON COLUMN public.jobs.tasks IS 'Array of typical tasks from CareerOneStop';
COMMENT ON COLUMN public.jobs.tools_and_technology IS 'Array of tools and technology used in occupation';

-- Add index on onet_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_jobs_onet_code ON public.jobs(onet_code);
