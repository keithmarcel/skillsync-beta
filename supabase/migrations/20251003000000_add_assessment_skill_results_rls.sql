-- Add RLS policies for assessment_skill_results table
-- Users should be able to read their own assessment skill results

CREATE POLICY "Users can view their own assessment skill results"
ON assessment_skill_results
FOR SELECT
USING (
  assessment_id IN (
    SELECT id FROM assessments WHERE user_id = auth.uid()
  )
);

-- Admins can view all assessment skill results
CREATE POLICY "Admins can view all assessment skill results"
ON assessment_skill_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'provider_admin', 'employer_admin')
  )
);
