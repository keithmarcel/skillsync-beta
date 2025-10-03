-- Multi-role schema extensions
-- This migration adds tables and constraints that use the new enum values
-- Must run AFTER enum values are added and committed

-- Add association columns to profiles table for admin role management
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS max_programs INTEGER,
ADD COLUMN IF NOT EXISTS max_featured_programs INTEGER,
ADD COLUMN IF NOT EXISTS max_featured_roles INTEGER,
ADD COLUMN IF NOT EXISTS is_mock_user BOOLEAN DEFAULT false;

-- Add role constraint (now that enum values exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_role' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT valid_role CHECK (role IN ('super_admin', 'provider_admin', 'employer_admin', 'user', 'partner_admin', 'org_user', 'basic_user'));
  END IF;
END $$;

-- Add association constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'provider_has_school' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT provider_has_school CHECK (
      role != 'provider_admin' OR school_id IS NOT NULL
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employer_has_company' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT employer_has_company CHECK (
      role != 'employer_admin' OR company_id IS NOT NULL
    );
  END IF;
END $$;

-- Create admin_invitations table
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('provider_admin', 'employer_admin')),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token TEXT UNIQUE NOT NULL,
  max_programs INTEGER,
  max_featured_programs INTEGER,
  max_featured_roles INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure role matches association
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'invitation_role_association' 
    AND conrelid = 'public.admin_invitations'::regclass
  ) THEN
    ALTER TABLE public.admin_invitations
    ADD CONSTRAINT invitation_role_association CHECK (
      (role = 'provider_admin' AND school_id IS NOT NULL AND company_id IS NULL) OR
      (role = 'employer_admin' AND company_id IS NOT NULL AND school_id IS NULL)
    );
  END IF;
END $$;

-- Enable RLS on admin_invitations
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_invitations
DO $$ BEGIN
  CREATE POLICY "Super admins can manage invitations" ON public.admin_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_invitations_token ON public.admin_invitations(token);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON public.admin_invitations(email);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_status ON public.admin_invitations(status);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
