-- Migration: 20250924_fix_featured_role_categories.sql
-- Description: Update featured roles to have proper categories instead of "Featured Role"
-- Author: System Migration
-- Date: 2025-09-24

BEGIN;

-- Create migration tracking if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if this migration has already been run
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.migrations WHERE name = '20250924_fix_featured_role_categories') THEN
    RAISE NOTICE 'Migration 20250924_fix_featured_role_categories has already been executed';
    RETURN;
  END IF;

  -- Execute the migration
  RAISE NOTICE 'Executing migration: 20250924_fix_featured_role_categories';

  -- Update Skilled Trades roles
  UPDATE public.jobs 
  SET 
    category = 'Skilled Trades',
    updated_at = NOW()
  WHERE job_kind = 'featured_role' 
    AND title IN (
      'Mechanical Assistant Project Manager',
      'Mechanical Project Manager', 
      'Senior Mechanical Project Manager'
    );

  -- Update Business roles  
  UPDATE public.jobs 
  SET 
    category = 'Business',
    updated_at = NOW()
  WHERE job_kind = 'featured_role' 
    AND title IN (
      'Senior Financial Analyst (FP&A)',
      'Business Development Manager',
      'Administrative Assistant',
      'Supervisor, Residential Inbound Sales'
    );

  -- Update Health & Education roles
  UPDATE public.jobs 
  SET 
    category = 'Health & Education',
    updated_at = NOW()
  WHERE job_kind = 'featured_role' 
    AND title IN (
      'Surgical Technologist (Certified)'
    );

  -- Update any remaining featured roles with incorrect categories
  UPDATE public.jobs 
  SET 
    category = 'Business',
    updated_at = NOW()
  WHERE job_kind = 'featured_role' 
    AND (
      category = 'Featured Role' 
      OR category IS NULL 
      OR category = ''
      OR category NOT IN (
        'Business', 
        'Health & Education', 
        'Tech & Services', 
        'Finance & Legal', 
        'Skilled Trades', 
        'Logistics', 
        'Hospitality', 
        'Public Services'
      )
    );

  -- Record the migration as completed
  INSERT INTO public.migrations (name) VALUES ('20250924_fix_featured_role_categories');
  
  RAISE NOTICE 'Migration 20250924_fix_featured_role_categories completed successfully';
END $$;

COMMIT;
