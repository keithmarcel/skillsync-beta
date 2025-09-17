-- supabase/migrations/20250917175000_fix_profiles_rls_recursion.sql

-- Drop existing policies on the profiles table to remove the recursive ones.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a safe, non-recursive policy for users to view their own profile.
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Create a safe, non-recursive policy for admins to view all profiles.
-- This checks the role of the *currently authenticated user*, not the role of the row being accessed,
-- which avoids recursion.
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        (SELECT admin_role FROM public.profiles WHERE id = auth.uid()) IS NOT NULL
    );

-- Create a safe, non-recursive policy for users to update their own profile.
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
