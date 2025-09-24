-- Migration: 20250924_ensure_favorites_table_structure.sql
-- Description: Ensure favorites table exists with correct structure and constraints
-- Author: System Migration
-- Date: 2025-09-24

BEGIN;

-- Check if this migration has already been run
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.migrations WHERE name = '20250924_ensure_favorites_table_structure') THEN
    RAISE NOTICE 'Migration 20250924_ensure_favorites_table_structure has already been executed';
    RETURN;
  END IF;

  -- Execute the migration
  RAISE NOTICE 'Executing migration: 20250924_ensure_favorites_table_structure';

  -- Create favorites table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_kind TEXT NOT NULL CHECK (entity_kind IN ('job', 'program')),
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of user_id, entity_kind, entity_id
    UNIQUE(user_id, entity_kind, entity_id)
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_entity ON public.favorites(entity_kind, entity_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_user_entity ON public.favorites(user_id, entity_kind, entity_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at);

  -- Create updated_at trigger function if it doesn't exist
  CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Create trigger for updated_at
  DROP TRIGGER IF EXISTS update_favorites_updated_at ON public.favorites;
  CREATE TRIGGER update_favorites_updated_at
    BEFORE UPDATE ON public.favorites
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

  -- Grant permissions
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
  GRANT USAGE ON SCHEMA public TO authenticated;

  -- Record the migration as completed
  INSERT INTO public.migrations (name) VALUES ('20250924_ensure_favorites_table_structure');
  
  RAISE NOTICE 'Migration 20250924_ensure_favorites_table_structure completed successfully';
  RAISE NOTICE 'Favorites table structure verified and optimized';
END $$;

COMMIT;
