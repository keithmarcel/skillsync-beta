-- Migration: Add is_published field to companies table
-- This replaces is_trusted_partner as the main visibility control
-- Run this in your Supabase SQL Editor

-- Add the is_published column with default value of true for existing companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN companies.is_published IS 'Controls whether the company and its jobs are visible in the main app. When false, company and all related data are hidden from users.';

-- Ensure all existing companies are published by default
UPDATE companies
SET is_published = true
WHERE is_published IS NULL;

-- Optional: You can also add an index for performance
CREATE INDEX IF NOT EXISTS idx_companies_is_published ON companies(is_published);
