-- Add status column to jobs table for draft/publish workflow
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));

-- Add admin_role to profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'admin_role') THEN
        ALTER TABLE public.profiles ADD COLUMN admin_role text CHECK (admin_role IN ('super_admin', 'company_admin', 'provider_admin'));
    END IF;
END $$;

-- Add company_id to profiles for company admin scoping
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_id') THEN
        ALTER TABLE public.profiles ADD COLUMN company_id uuid REFERENCES public.companies(id);
    END IF;
END $$;

-- Add school_id to profiles for provider admin scoping  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'school_id') THEN
        ALTER TABLE public.profiles ADD COLUMN school_id uuid REFERENCES public.schools(id);
    END IF;
END $$;

-- Set super admin for keith-woods@bisk.com
UPDATE public.profiles 
SET admin_role = 'super_admin' 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'keith-woods@bisk.com'
);

-- Create function to count company roles (for 10 role limit)
CREATE OR REPLACE FUNCTION count_company_roles(company_uuid uuid)
RETURNS integer AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::integer 
        FROM public.jobs 
        WHERE company_id = company_uuid 
        AND job_kind = 'featured_role'
        AND status != 'archived'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to count provider programs (for 300 program limit)
CREATE OR REPLACE FUNCTION count_provider_programs(school_uuid uuid)
RETURNS integer AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::integer 
        FROM public.programs 
        WHERE school_id = school_uuid
        AND status != 'archived'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add status column to programs table
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));

-- Create trigger to clean up favorites when jobs are archived/deleted
CREATE OR REPLACE FUNCTION cleanup_job_favorites()
RETURNS TRIGGER AS $$
BEGIN
    -- Remove from favorites when job is archived or deleted
    IF (NEW.status = 'archived') OR (TG_OP = 'DELETE') THEN
        DELETE FROM public.favorites 
        WHERE entity_kind = 'job' 
        AND entity_id = COALESCE(NEW.id, OLD.id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for job favorites cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_job_favorites ON public.jobs;
CREATE TRIGGER trigger_cleanup_job_favorites
    AFTER UPDATE OF status OR DELETE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_job_favorites();

-- Create trigger to clean up favorites when programs are archived/deleted
CREATE OR REPLACE FUNCTION cleanup_program_favorites()
RETURNS TRIGGER AS $$
BEGIN
    -- Remove from favorites when program is archived or deleted
    IF (NEW.status = 'archived') OR (TG_OP = 'DELETE') THEN
        DELETE FROM public.favorites 
        WHERE entity_kind = 'program' 
        AND entity_id = COALESCE(NEW.id, OLD.id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for program favorites cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_program_favorites ON public.programs;
CREATE TRIGGER trigger_cleanup_program_favorites
    AFTER UPDATE OF status OR DELETE ON public.programs
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_program_favorites();
