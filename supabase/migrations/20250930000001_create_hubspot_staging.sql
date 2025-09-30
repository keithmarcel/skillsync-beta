-- Migration: Create HubSpot programs staging table
-- Date: 2025-09-30
-- Description: Staging table for HubSpot CSV import with all fields preserved

CREATE TABLE IF NOT EXISTS public.hubspot_programs_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core program fields
  record_id TEXT NOT NULL,
  program_name TEXT,
  degree_type_name TEXT,
  discipline TEXT,
  discipline_name TEXT,
  program_format TEXT,
  program_duration TEXT,
  
  -- University/School
  university TEXT,
  university_name_sync TEXT,
  
  -- Descriptions
  overview TEXT,
  admission_detail TEXT,
  benefits TEXT,
  what_youll_learn TEXT,
  who_should_register TEXT,
  why_program TEXT,
  curriculum TEXT,
  
  -- Financial
  tuition TEXT,
  tuition_cost TEXT,
  cost_per_credit_hour TEXT,
  total_credit_hours TEXT,
  
  -- URLs and Media
  program_guide_url TEXT,
  hero_image_url TEXT,
  program_image TEXT,
  
  -- Additional metadata
  proficiency_level TEXT,
  career_pathway TEXT,
  weekly_commitment TEXT,
  next_start_date TEXT,
  is_active TEXT,
  is_amplified TEXT,
  
  -- Raw data preservation
  raw_data JSONB,
  
  -- Processing tracking
  mapped_to_program_id UUID REFERENCES public.programs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processing_notes TEXT,
  
  -- Constraints
  CONSTRAINT unique_record_id UNIQUE(record_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staging_record_id ON public.hubspot_programs_staging(record_id);
CREATE INDEX IF NOT EXISTS idx_staging_processed ON public.hubspot_programs_staging(processed);
CREATE INDEX IF NOT EXISTS idx_staging_university ON public.hubspot_programs_staging(university);
CREATE INDEX IF NOT EXISTS idx_staging_discipline ON public.hubspot_programs_staging(discipline);

-- Comments
COMMENT ON TABLE public.hubspot_programs_staging IS 'Staging table for HubSpot programs CSV import';
COMMENT ON COLUMN public.hubspot_programs_staging.record_id IS 'HubSpot Record ID (11-character identifier)';
COMMENT ON COLUMN public.hubspot_programs_staging.raw_data IS 'Complete CSV row stored as JSON for reference';
COMMENT ON COLUMN public.hubspot_programs_staging.mapped_to_program_id IS 'Link to programs table after successful mapping';
