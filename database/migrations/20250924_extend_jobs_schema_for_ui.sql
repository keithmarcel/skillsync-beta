-- Migration: Extend jobs schema for comprehensive UI support
-- Date: 2025-09-24
-- Purpose: Add missing fields needed for job details pages and data pipeline infrastructure

BEGIN;

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migrations (
  name TEXT PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Check if migration already executed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.migrations WHERE name = '20250924_extend_jobs_schema_for_ui') THEN
    RAISE NOTICE 'Migration 20250924_extend_jobs_schema_for_ui already executed';
    RETURN;
  END IF;

  -- Add missing columns to jobs table for comprehensive data support
  
  -- Education and growth data (for occupations)
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS education_requirements TEXT;
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS projected_open_positions INTEGER;
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_growth_outlook TEXT;
  
  -- Core responsibilities (JSON array for flexibility)
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS core_responsibilities JSONB;
  
  -- Related job titles (for occupations - JSON array)
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS related_job_titles JSONB;
  
  -- Proficiency score (for featured roles when user has assessment)
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS proficiency_score INTEGER;
  
  -- Additional metadata for pipeline integration
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS onet_updated_at TIMESTAMP;
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS bls_updated_at TIMESTAMP;
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual';
  
  -- Ensure companies table has logo_url if not exists
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_image TEXT;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS hq_city TEXT;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS hq_state TEXT;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS revenue_range TEXT;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee_range TEXT;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry TEXT;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS bio TEXT;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_trusted_partner BOOLEAN DEFAULT false;

  -- Add indexes for performance
  CREATE INDEX IF NOT EXISTS idx_jobs_job_kind ON jobs(job_kind);
  CREATE INDEX IF NOT EXISTS idx_jobs_soc_code ON jobs(soc_code);
  CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
  CREATE INDEX IF NOT EXISTS idx_companies_is_published ON companies(is_published);
  CREATE INDEX IF NOT EXISTS idx_companies_is_trusted_partner ON companies(is_trusted_partner);

  -- Insert some sample data for testing UI
  -- Sample occupation data
  INSERT INTO jobs (
    id,
    job_kind,
    title,
    soc_code,
    category,
    median_wage_usd,
    long_desc,
    education_requirements,
    projected_open_positions,
    job_growth_outlook,
    core_responsibilities,
    related_job_titles,
    data_source
  ) VALUES (
    gen_random_uuid(),
    'occupation',
    'Project Management Specialists',
    '13-1082',
    'Business',
    86700,
    'Project Management Specialists coordinate and manage projects across various industries to ensure they meet scope, budget and timeline requirements. They serve as a bridge between stakeholders, resources, and teams, driving efficiency and accountability from planning through delivery.',
    'Bachelor''s Degree',
    18000,
    '+8% through 2030',
    '["Analyze and approve business operations to improve efficiency and effectiveness", "Identify operational risks and develop strategies to mitigate them", "Manage project related correspondence and documents through designated systems", "Work closely with various departments to streamline processes and improve outcomes", "Use data analysis and metrics to support strategic initiatives and identify opportunities"]'::jsonb,
    '["Operations Coordinator", "Operations Support Specialist", "Business Process Analyst", "Process Improvement Specialist"]'::jsonb,
    'mock_data'
  ) ON CONFLICT (id) DO NOTHING;

  -- Update existing featured roles with sample data where missing
  UPDATE jobs 
  SET 
    education_requirements = COALESCE(education_requirements, 'Bachelor''s Degree'),
    core_responsibilities = COALESCE(core_responsibilities, '["Manage project deliverables and timelines", "Coordinate with stakeholders and team members", "Ensure quality standards are met", "Monitor project budgets and resources", "Communicate progress and issues to leadership"]'::jsonb),
    data_source = COALESCE(data_source, 'manual')
  WHERE job_kind = 'featured_role' AND education_requirements IS NULL;

  -- Record migration completion
  INSERT INTO public.migrations (name) VALUES ('20250924_extend_jobs_schema_for_ui');
  
  RAISE NOTICE 'Migration 20250924_extend_jobs_schema_for_ui completed successfully';
END $$;

COMMIT;
