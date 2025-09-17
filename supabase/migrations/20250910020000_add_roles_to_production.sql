-- Add role system to existing production database
-- Only add what doesn't already exist

-- Create user role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM (
      'super_admin',
      'partner_admin', 
      'org_user',
      'basic_user'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'basic_user' NOT NULL;

-- Add missing profile fields if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS agreed_to_terms boolean DEFAULT false;

-- Create company_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.company_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_users_pkey PRIMARY KEY (id),
  CONSTRAINT company_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT company_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT company_users_unique UNIQUE (user_id, company_id)
);

-- Enable RLS on company_users if not already enabled
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (will skip if they already exist)
DO $$ BEGIN
  -- Super admins can view all profiles
  CREATE POLICY "Super admins can view all profiles" ON public.profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p2 
      WHERE p2.id = auth.uid() 
      AND p2.role = 'super_admin'
    )
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  -- Partner admins can view basic user profiles
  CREATE POLICY "Partner admins can view basic users" ON public.profiles 
  FOR SELECT USING (
    role = 'basic_user' AND 
    EXISTS (
      SELECT 1 FROM public.profiles p2 
      WHERE p2.id = auth.uid() 
      AND p2.role = 'partner_admin'
    )
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);
