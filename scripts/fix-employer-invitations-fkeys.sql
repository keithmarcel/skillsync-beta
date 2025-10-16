-- Fix missing foreign keys on employer_invitations table
-- This is why Supabase can't find the relationships

-- First, check current foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'employer_invitations';

-- Add foreign key constraints if they don't exist
-- user_id -> profiles(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employer_invitations_user_id_fkey' 
    AND table_name = 'employer_invitations'
  ) THEN
    ALTER TABLE employer_invitations
    ADD CONSTRAINT employer_invitations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: employer_invitations_user_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key employer_invitations_user_id_fkey already exists';
  END IF;
END $$;

-- job_id -> jobs(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employer_invitations_job_id_fkey' 
    AND table_name = 'employer_invitations'
  ) THEN
    ALTER TABLE employer_invitations
    ADD CONSTRAINT employer_invitations_job_id_fkey
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: employer_invitations_job_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key employer_invitations_job_id_fkey already exists';
  END IF;
END $$;

-- company_id -> companies(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employer_invitations_company_id_fkey' 
    AND table_name = 'employer_invitations'
  ) THEN
    ALTER TABLE employer_invitations
    ADD CONSTRAINT employer_invitations_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: employer_invitations_company_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key employer_invitations_company_id_fkey already exists';
  END IF;
END $$;

-- Verify the foreign keys were added
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'employer_invitations'
ORDER BY kcu.column_name;
