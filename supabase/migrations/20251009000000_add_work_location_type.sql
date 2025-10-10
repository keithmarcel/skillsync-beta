-- Migration: Add work_location_type field to jobs table
-- Purpose: Store work arrangement (Onsite, Remote, Hybrid) for featured roles
-- Date: 2025-10-09

BEGIN;

-- Check if migration has already been applied
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.migrations WHERE name = '20251009000000_add_work_location_type'
  ) THEN
    
    -- Add work_location_type column
    ALTER TABLE public.jobs 
    ADD COLUMN IF NOT EXISTS work_location_type TEXT 
    CHECK (work_location_type IN ('Onsite', 'Remote', 'Hybrid', NULL));
    
    -- Add comment
    COMMENT ON COLUMN public.jobs.work_location_type IS 'Work arrangement: Onsite, Remote, or Hybrid';
    
    -- Record migration
    INSERT INTO public.migrations (name, executed_at)
    VALUES ('20251009000000_add_work_location_type', NOW());
    
    RAISE NOTICE 'Migration 20251009000000_add_work_location_type completed successfully';
  ELSE
    RAISE NOTICE 'Migration 20251009000000_add_work_location_type already applied, skipping';
  END IF;
END $$;

COMMIT;
