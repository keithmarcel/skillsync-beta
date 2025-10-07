-- Add short_desc column to jobs table for AI-generated short descriptions
-- This will be used in tables and cards where long_desc is too verbose

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS short_desc TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN jobs.short_desc IS 'AI-generated short description (13-15 words, ~95 characters) for use in tables and cards';
