-- Add user_id foreign key directly
-- No orphaned records, so this should work

ALTER TABLE employer_invitations
ADD CONSTRAINT employer_invitations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Verify it was added
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
