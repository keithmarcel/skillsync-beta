-- Enable RLS on feedback table
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON public.feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
