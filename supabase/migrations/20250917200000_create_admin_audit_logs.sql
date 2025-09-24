-- supabase/migrations/20250917200000_create_admin_audit_logs.sql

-- Create the table for admin audit logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    status text NOT NULL CHECK (status IN ('success', 'error', 'pending')),
    metadata jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for admin_audit_logs
-- Super Admins can see all logs
CREATE POLICY "Super Admins can view all audit logs" 
ON public.admin_audit_logs
FOR SELECT
USING ((
  SELECT admin_role 
  FROM public.profiles 
  WHERE id = auth.uid()
) = 'super_admin');

-- Admins can insert their own logs (implicitly)
CREATE POLICY "Admins can insert their own audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());
