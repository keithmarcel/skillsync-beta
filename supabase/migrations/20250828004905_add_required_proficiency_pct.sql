-- Add required_proficiency_pct column to jobs table if it doesn't exist
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS required_proficiency_pct numeric;

-- Update existing featured roles with sample proficiency data
UPDATE public.jobs 
SET required_proficiency_pct = 
  CASE 
    WHEN title ILIKE '%nurse%' OR title ILIKE '%medical%' THEN 95
    WHEN title ILIKE '%engineer%' OR title ILIKE '%developer%' THEN 85
    WHEN title ILIKE '%technician%' OR title ILIKE '%mechanic%' THEN 80
    WHEN title ILIKE '%manager%' OR title ILIKE '%supervisor%' THEN 75
    ELSE 70
  END
WHERE category = 'Featured Role' AND required_proficiency_pct IS NULL;