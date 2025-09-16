-- Add missing fields to production profiles table based on schema inspection

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

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'basic_user' NOT NULL,
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS agreed_to_terms boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Rename zip to zip_code if zip exists but zip_code doesn't
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'zip') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'zip_code') THEN
        ALTER TABLE public.profiles RENAME COLUMN zip TO zip_code;
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'profiles_id_fkey' 
                   AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add primary key if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_type = 'PRIMARY KEY' 
                   AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (will skip if they already exist)
DO $$ BEGIN
    -- Users can view and update their own profile
    CREATE POLICY "Users can view own profile" ON public.profiles 
    FOR SELECT USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own profile" ON public.profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
