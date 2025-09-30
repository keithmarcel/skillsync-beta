-- Migration: Extend programs schema for HubSpot integration
-- Date: 2025-09-30
-- Description: Add program_id, catalog_provider, discipline, long_desc, and program_guide_url fields

-- Step 1: Add new columns to programs table
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS program_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS catalog_provider TEXT,
ADD COLUMN IF NOT EXISTS discipline TEXT,
ADD COLUMN IF NOT EXISTS long_desc TEXT,
ADD COLUMN IF NOT EXISTS program_guide_url TEXT;

-- Step 2: Create index on program_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_programs_program_id ON public.programs(program_id);
CREATE INDEX IF NOT EXISTS idx_programs_discipline ON public.programs(discipline);
CREATE INDEX IF NOT EXISTS idx_programs_catalog_provider ON public.programs(catalog_provider);

-- Step 3: Generate program_ids for existing programs (11-char alphanumeric starting with '3')
-- This ensures consistency with HubSpot Record IDs
DO $$
DECLARE
  program_record RECORD;
  new_program_id TEXT;
BEGIN
  FOR program_record IN 
    SELECT id FROM public.programs WHERE program_id IS NULL
  LOOP
    -- Generate 11-character ID starting with '3' followed by 10 random alphanumeric chars
    new_program_id := '3' || substring(md5(random()::text || program_record.id::text) from 1 for 10);
    
    UPDATE public.programs 
    SET 
      program_id = new_program_id,
      catalog_provider = 'Direct'
    WHERE id = program_record.id;
  END LOOP;
END $$;

-- Step 4: Set discipline for existing programs based on program names
UPDATE public.programs 
SET discipline = CASE 
  WHEN name ILIKE '%business%' OR name ILIKE '%management%' THEN 'Business'
  WHEN name ILIKE '%construction%' THEN 'Engineering & Construction'
  WHEN name ILIKE '%project management%' THEN 'Business'
  ELSE 'General Studies'
END
WHERE discipline IS NULL;

-- Step 5: Make program_id NOT NULL after backfilling
ALTER TABLE public.programs 
ALTER COLUMN program_id SET NOT NULL;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN public.programs.program_id IS '11-character unique identifier (HubSpot Record ID or generated)';
COMMENT ON COLUMN public.programs.catalog_provider IS 'Program catalog source: Direct, Bisk Amplified, etc.';
COMMENT ON COLUMN public.programs.discipline IS 'Program discipline/category: Business, Technology, Healthcare, etc.';
COMMENT ON COLUMN public.programs.long_desc IS 'Full program description/overview';
COMMENT ON COLUMN public.programs.program_guide_url IS 'External program guide URL';
