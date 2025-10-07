-- Fix infinite recursion in profiles RLS policies
-- The issue: policies are checking profiles table while querying profiles table

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create simple, non-recursive policies

-- 1. Users can view their own profile (no recursion)
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- 2. Users can update their own profile (no recursion)
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. Users can insert their own profile during signup (no recursion)
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 4. Service role can do everything (bypass RLS)
-- This is handled by service_role key, no policy needed

-- Add comment
COMMENT ON TABLE public.profiles IS 'User profiles with simple RLS policies to avoid recursion. Admin access should use service_role key.';
