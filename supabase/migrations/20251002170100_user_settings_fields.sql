-- User Settings Fields
-- Adds fields for profile, account, and notification preferences

-- Add profile fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS visible_to_employers BOOLEAN DEFAULT true;

-- Add notification preferences columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notif_in_app_invites BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notif_in_app_new_roles BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notif_email_new_roles BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notif_email_invites BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notif_email_marketing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notif_email_security BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notif_all_disabled BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN public.profiles.bio IS 'User bio/about section for career goals';
COMMENT ON COLUMN public.profiles.visible_to_employers IS 'Privacy setting - allow employers to invite user to apply';
COMMENT ON COLUMN public.profiles.notif_in_app_invites IS 'In-app notification for new employer invitations';
COMMENT ON COLUMN public.profiles.notif_in_app_new_roles IS 'In-app notification for new roles/occupations';
COMMENT ON COLUMN public.profiles.notif_email_new_roles IS 'Email notification for new roles/occupations';
COMMENT ON COLUMN public.profiles.notif_email_invites IS 'Email notification for new employer invitations';
COMMENT ON COLUMN public.profiles.notif_email_marketing IS 'Email notification for marketing emails';
COMMENT ON COLUMN public.profiles.notif_email_security IS 'Email notification for security alerts';
COMMENT ON COLUMN public.profiles.notif_all_disabled IS 'Master switch to disable all notifications';
