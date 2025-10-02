-- Update existing role values to new enum values
-- This must run AFTER the enum values are added and committed

-- Update existing partner_admin to provider_admin
UPDATE public.profiles 
SET role = 'provider_admin' 
WHERE role = 'partner_admin';

-- Update existing org_user to employer_admin
UPDATE public.profiles 
SET role = 'employer_admin' 
WHERE role = 'org_user';

-- Update existing basic_user to user
UPDATE public.profiles 
SET role = 'user' 
WHERE role = 'basic_user';
