-- Create content workflow status table for tracking approval workflows
CREATE TABLE IF NOT EXISTS public.content_workflow_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL,
    entity_type TEXT NOT NULL, -- 'jobs', 'programs', 'companies', etc.
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'published', 'archived')),
    previous_status TEXT,
    requested_by TEXT NOT NULL,
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_entity ON public.content_workflow_status(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_workflow_status ON public.content_workflow_status(status);
CREATE INDEX IF NOT EXISTS idx_workflow_created ON public.content_workflow_status(created_at DESC);

-- Enable RLS
ALTER TABLE public.content_workflow_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view workflow status" ON public.content_workflow_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role IS NOT NULL
        )
    );

CREATE POLICY "Admins can insert workflow status" ON public.content_workflow_status
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role IS NOT NULL
        )
    );

-- Grant permissions
GRANT ALL ON public.content_workflow_status TO authenticated;
GRANT ALL ON public.content_workflow_status TO service_role;
