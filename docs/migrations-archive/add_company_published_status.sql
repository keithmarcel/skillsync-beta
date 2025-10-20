-- Migration: Add is_published field to companies table
-- Run this in your Supabase SQL Editor

-- Add the is_published column with default value of true for existing companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Update the comment on the column for documentation
COMMENT ON COLUMN companies.is_published IS 'Controls whether the company and its jobs are visible in the main app. When false, company and all related data are hidden from users.';

-- Optional: Update existing companies to be published by default
-- This ensures existing companies remain visible
UPDATE companies SET is_published = true WHERE is_published IS NULL;
