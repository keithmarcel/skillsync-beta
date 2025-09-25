-- Diagnostic: Check current skills taxonomy table structure
-- Date: 2025-09-24
-- Purpose: Understand what tables and columns actually exist before making changes

BEGIN;

-- Check what skills-related tables exist and their structure
SELECT
  'TABLE_EXISTS' as check_type,
  table_name,
  CASE WHEN table_name = 'skills' THEN 'Core skills table'
       WHEN table_name = 'job_skills' THEN 'Job-skill relationships'
       WHEN table_name = 'program_skills' THEN 'Program-skill relationships'
       ELSE 'Other table'
  END as description
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('skills', 'job_skills', 'program_skills');

-- Check columns in job_skills table
SELECT
  'JOB_SKILLS_COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'job_skills'
ORDER BY ordinal_position;

-- Check columns in program_skills table (if exists)
SELECT
  'PROGRAM_SKILLS_COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'program_skills'
ORDER BY ordinal_position;

-- Check if we have any data
SELECT
  'DATA_COUNTS' as check_type,
  'skills' as table_name,
  COUNT(*) as record_count
FROM skills
UNION ALL
SELECT
  'DATA_COUNTS' as check_type,
  'job_skills' as table_name,
  COUNT(*) as record_count
FROM job_skills
UNION ALL
SELECT
  'DATA_COUNTS' as check_type,
  'program_skills' as table_name,
  COUNT(*) as record_count
FROM program_skills;

COMMIT;
