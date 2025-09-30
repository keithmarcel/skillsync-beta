-- Migration: Add catalog_affiliation to schools table
-- Date: 2025-09-30
-- Description: Allow schools to have multiple catalog affiliations (one-to-many via programs)
--              Example: USF can have both Direct programs and Bisk Amplified programs

-- Add catalog_affiliation column to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS catalog_affiliation TEXT;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_schools_catalog_affiliation ON public.schools(catalog_affiliation);

-- Add comment
COMMENT ON COLUMN public.schools.catalog_affiliation IS 'Primary catalog affiliation for the school (can have programs in multiple catalogs)';

-- Note: Individual programs have their own catalog_provider field
-- This allows: School (USF) → Programs (some Direct, some Bisk Amplified)
