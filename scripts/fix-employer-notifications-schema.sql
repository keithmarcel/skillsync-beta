-- COMPREHENSIVE FIX: Employer Notifications Schema
-- This ensures proper foreign keys and schema cache refresh for production-grade notifications

-- ============================================================================
-- STEP 1: Add Missing Foreign Key Constraints
-- ============================================================================

-- Add user_id foreign key if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employer_invitations_user_id_fkey'
    AND table_name = 'employer_invitations'
  ) THEN
    ALTER TABLE employer_invitations
    ADD CONSTRAINT employer_invitations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added foreign key: employer_invitations_user_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key employer_invitations_user_id_fkey already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Add status_before_archive Column
-- ============================================================================

DO $$
BEGIN
  -- Add column if it doesn't exist
  ALTER TABLE employer_invitations 
  ADD COLUMN IF NOT EXISTS status_before_archive TEXT;

  -- Update existing archived records
  UPDATE employer_invitations
  SET status_before_archive = status
  WHERE status = 'archived' AND status_before_archive IS NULL;

  RAISE NOTICE '✅ Added status_before_archive column';
END $$;

COMMENT ON COLUMN employer_invitations.status_before_archive IS 
  'Stores the status before archiving, used to restore when unarchiving';

-- ============================================================================
-- STEP 3: Add Indexes for Performance
-- ============================================================================

-- Index for notification queries (company_id + status + responded_at)
CREATE INDEX IF NOT EXISTS idx_employer_invitations_notifications 
ON employer_invitations(company_id, status, responded_at DESC)
WHERE responded_at IS NOT NULL AND is_read_by_employer = false;

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_employer_invitations_user_id 
ON employer_invitations(user_id);

-- Index for job lookups
CREATE INDEX IF NOT EXISTS idx_employer_invitations_job_id 
ON employer_invitations(job_id);

-- ============================================================================
-- STEP 4: Force PostgREST Schema Cache Reload
-- ============================================================================

-- Notify PostgREST to reload schema cache (must be outside DO block)
NOTIFY pgrst, 'reload schema';

-- Print completion messages
DO $$
BEGIN
  RAISE NOTICE '✅ Added performance indexes';
  RAISE NOTICE '✅ Triggered PostgREST schema cache reload';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: You may need to restart your Supabase instance or wait 1-2 minutes for the schema cache to fully refresh.';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 5: Verify Setup
-- ============================================================================

-- Verify foreign keys
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'employer_invitations'
  AND tc.table_schema = 'public'
ORDER BY kcu.column_name;

-- Verify indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'employer_invitations'
  AND schemaname = 'public'
ORDER BY indexname;

-- Verify column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'employer_invitations'
  AND column_name = 'status_before_archive'
  AND table_schema = 'public';
