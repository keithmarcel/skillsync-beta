-- Refresh Supabase schema cache
-- This forces PostgREST to reload the database schema

-- First verify the foreign key exists
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'employer_invitations'
  AND kcu.column_name = 'user_id';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
