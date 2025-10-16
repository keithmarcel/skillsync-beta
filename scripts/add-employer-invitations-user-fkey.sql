-- Add missing foreign key constraint for user_id in employer_invitations

-- First check if the constraint already exists (in case it was added manually)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employer_invitations_user_id_fkey'
    AND table_name = 'employer_invitations'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE employer_invitations
    ADD CONSTRAINT employer_invitations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added foreign key constraint: employer_invitations_user_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- Verify the constraint was added
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'employer_invitations'
  AND kcu.column_name = 'user_id'
  AND tc.table_schema = 'public';
