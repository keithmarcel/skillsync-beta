-- IMMEDIATE FIX: Run this SQL in your Supabase Dashboard → SQL Editor
-- This will fix the "column companies.is_published does not exist" error

-- Add the is_published column with default value of true for existing companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN companies.is_published IS 'Controls whether the company and its jobs are visible in the main app. When false, company and all related data are hidden from users.';

-- Ensure all existing companies are published by default
UPDATE companies
SET is_published = true
WHERE is_published IS NULL OR is_published IS NOT TRUE;

-- Optional: You can also add an index for performance
CREATE INDEX IF NOT EXISTS idx_companies_is_published ON companies(is_published);

-- Verify the changes
SELECT id, name, is_published, is_trusted_partner FROM companies LIMIT 5;
