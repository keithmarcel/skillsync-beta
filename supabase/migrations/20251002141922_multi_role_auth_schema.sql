-- Add new enum values for user roles
-- IMPORTANT: This migration ONLY adds enum values
-- Constraints and usage must be in a separate migration after commit

-- Add new enum values (must be done in separate statements and committed before use)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'provider_admin' AND enumtypid = 'public.user_role'::regtype) THEN
    ALTER TYPE public.user_role ADD VALUE 'provider_admin';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'employer_admin' AND enumtypid = 'public.user_role'::regtype) THEN
    ALTER TYPE public.user_role ADD VALUE 'employer_admin';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user' AND enumtypid = 'public.user_role'::regtype) THEN
    ALTER TYPE public.user_role ADD VALUE 'user';
  END IF;
END $$;
