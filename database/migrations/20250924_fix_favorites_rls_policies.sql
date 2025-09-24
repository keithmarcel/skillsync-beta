-- Migration: 20250924_fix_favorites_rls_policies.sql
-- Description: Fix Row-Level Security policies for favorites table to allow authenticated users to manage their favorites
-- Author: System Migration
-- Date: 2025-09-24

BEGIN;

-- Check if this migration has already been run
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.migrations WHERE name = '20250924_fix_favorites_rls_policies') THEN
    RAISE NOTICE 'Migration 20250924_fix_favorites_rls_policies has already been executed';
    RETURN;
  END IF;

  -- Execute the migration
  RAISE NOTICE 'Executing migration: 20250924_fix_favorites_rls_policies';

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
  DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
  DROP POLICY IF EXISTS "Users can update their own favorites" ON public.favorites;
  DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

  -- Enable RLS on favorites table
  ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

  -- Create comprehensive RLS policies for favorites table
  
  -- Policy for SELECT: Users can view their own favorites
  CREATE POLICY "Users can view their own favorites" ON public.favorites
    FOR SELECT
    USING (auth.uid() = user_id);

  -- Policy for INSERT: Users can add their own favorites
  CREATE POLICY "Users can insert their own favorites" ON public.favorites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- Policy for UPDATE: Users can update their own favorites
  CREATE POLICY "Users can update their own favorites" ON public.favorites
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Policy for DELETE: Users can delete their own favorites
  CREATE POLICY "Users can delete their own favorites" ON public.favorites
    FOR DELETE
    USING (auth.uid() = user_id);

  -- Grant necessary permissions to authenticated users
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;

  -- Ensure the favorites table has proper structure
  -- Add indexes for performance if they don't exist
  CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_entity ON public.favorites(entity_kind, entity_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_user_entity ON public.favorites(user_id, entity_kind, entity_id);

  -- Record the migration as completed
  INSERT INTO public.migrations (name) VALUES ('20250924_fix_favorites_rls_policies');
  
  RAISE NOTICE 'Migration 20250924_fix_favorites_rls_policies completed successfully';
  RAISE NOTICE 'RLS policies updated for favorites table';
  RAISE NOTICE 'Users can now manage their own favorites';
END $$;

COMMIT;
