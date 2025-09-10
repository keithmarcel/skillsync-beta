-- Create a development-only favorites table without foreign key constraints
-- This allows testing favorites functionality without requiring auth.users entries

CREATE TABLE IF NOT EXISTS public.dev_favorites (
  user_id text NOT NULL,
  entity_kind text NOT NULL CHECK (entity_kind = ANY (ARRAY['job'::text, 'program'::text])),
  entity_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dev_favorites_pkey PRIMARY KEY (user_id, entity_kind, entity_id)
);

-- Enable RLS but create permissive policy for development
ALTER TABLE public.dev_favorites ENABLE ROW LEVEL SECURITY;

-- Create policy that allows all operations for development
CREATE POLICY "Allow all operations for development" ON public.dev_favorites
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.dev_favorites TO anon;
GRANT ALL ON public.dev_favorites TO authenticated;
