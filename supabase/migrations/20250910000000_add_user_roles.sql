-- Add user roles system for SkillSync authentication
-- Create user role enum
CREATE TYPE public.user_role AS ENUM (
  'super_admin',
  'partner_admin', 
  'org_user',
  'basic_user'
);

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role public.user_role DEFAULT 'basic_user' NOT NULL;

-- Add additional profile fields for enhanced user management
-- Note: first_name, last_name, email, zip_code, agreed_to_terms, created_at, updated_at already exist in initial schema
-- Only adding fields that don't exist yet
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on profiles
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create company_users table for org_user role management
CREATE TABLE public.company_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_users_pkey PRIMARY KEY (id),
  CONSTRAINT company_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT company_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT company_users_unique UNIQUE (user_id, company_id)
);

-- Enable RLS on company_users
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_users
CREATE POLICY "Org users can view their company associations" ON public.company_users 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all company users" ON public.company_users 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Update existing RLS policies to include role-based access
-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" ON public.profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.id = auth.uid() 
    AND p2.role = 'super_admin'
  )
);

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

-- Org users can only view their own profile
-- (existing policy "Users can view own profile" covers this)

-- Update assessments policies for role-based access
CREATE POLICY "Super admins can view all assessments" ON public.assessments 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Partner admins can view basic user assessments" ON public.assessments 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.id = auth.uid() 
    AND p1.role = 'partner_admin'
    AND p2.id = assessments.user_id
    AND p2.role = 'basic_user'
  )
);

-- Create indexes for performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX idx_company_users_company_id ON public.company_users(company_id);

-- Note: Super admin user will be created through normal signup process
-- and then role can be updated manually in the database
