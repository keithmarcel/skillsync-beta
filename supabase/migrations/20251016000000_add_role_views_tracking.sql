-- Add view tracking for featured roles
-- This allows employers to see how many times their roles have been viewed

-- Add views_count column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create role_views table to track individual views
CREATE TABLE IF NOT EXISTS public.role_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT, -- For anonymous tracking
  referrer TEXT,
  user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_views_job_id ON public.role_views(job_id);
CREATE INDEX IF NOT EXISTS idx_role_views_user_id ON public.role_views(user_id);
CREATE INDEX IF NOT EXISTS idx_role_views_viewed_at ON public.role_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_jobs_views_count ON public.jobs(views_count);

-- RLS Policies for role_views
ALTER TABLE public.role_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views (for tracking)
CREATE POLICY "Anyone can track role views"
  ON public.role_views
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Employers can see views for their company's roles
CREATE POLICY "Employers can view their role views"
  ON public.role_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON p.company_id = j.company_id
      WHERE j.id = role_views.job_id
      AND p.id = auth.uid()
    )
  );

-- Super admins can see all views
CREATE POLICY "Super admins can view all role views"
  ON public.role_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_role_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.jobs
  SET views_count = views_count + 1
  WHERE id = NEW.job_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment view count
DROP TRIGGER IF EXISTS trigger_increment_role_view_count ON public.role_views;
CREATE TRIGGER trigger_increment_role_view_count
  AFTER INSERT ON public.role_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_role_view_count();

-- Comment on table
COMMENT ON TABLE public.role_views IS 'Tracks individual views of featured roles for analytics';
COMMENT ON COLUMN public.jobs.views_count IS 'Total number of times this role has been viewed';
