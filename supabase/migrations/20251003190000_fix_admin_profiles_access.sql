-- Fix RLS policies to allow admins to view all profiles in admin dashboard
-- The issue: Admin users can't see other users' profiles due to RLS restrictions

-- Drop conflicting policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Partner admins can view basic users" ON public.profiles;

-- Create comprehensive admin access policy
-- This allows any user with an admin_role to view all profiles
CREATE POLICY "Admin users can view all profiles" ON public.profiles
    FOR SELECT USING (
        -- Allow if the requesting user has any admin role
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.id = auth.uid()
            AND admin_check.admin_role IS NOT NULL
        )
        OR
        -- Or if viewing their own profile
        auth.uid() = id
    );

-- Add policy for admins to update any profile
CREATE POLICY "Admin users can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.id = auth.uid()
            AND admin_check.admin_role IN ('super_admin', 'company_admin', 'provider_admin')
        )
    );

-- Add policy for admins to insert profiles
CREATE POLICY "Admin users can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.id = auth.uid()
            AND admin_check.admin_role IN ('super_admin', 'company_admin', 'provider_admin')
        )
    );

-- Add policy for super admins to delete profiles
CREATE POLICY "Super admins can delete profiles" ON public.profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.id = auth.uid()
            AND admin_check.admin_role = 'super_admin'
        )
    );

-- Add comment explaining the policy
COMMENT ON POLICY "Admin users can view all profiles" ON public.profiles IS 
'Allows users with admin_role (super_admin, company_admin, provider_admin) to view all user profiles in the admin dashboard';
