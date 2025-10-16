-- Drop the old job_skills table (it has the wrong schema)
DROP TABLE IF EXISTS job_skills CASCADE;

-- Create job_skills junction table with correct schema
CREATE TABLE job_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  importance_level INTEGER DEFAULT 3 CHECK (importance_level >= 1 AND importance_level <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, skill_id)
);

-- Add indexes for performance
CREATE INDEX idx_job_skills_job_id ON job_skills(job_id);
CREATE INDEX idx_job_skills_skill_id ON job_skills(skill_id);
CREATE INDEX idx_job_skills_importance ON job_skills(importance_level);

-- Add RLS policies
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins have full access to job_skills"
  ON job_skills
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'keith-woods@bisk.com'
    )
  );

-- Company admins can manage skills for their company's roles
CREATE POLICY "Company admins can manage their job skills"
  ON job_skills
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN profiles ON profiles.company_id = jobs.company_id
      WHERE jobs.id = job_skills.job_id
      AND profiles.id = auth.uid()
      AND jobs.job_kind = 'featured_role'
    )
  );

-- Everyone can view published role skills
CREATE POLICY "Anyone can view published job skills"
  ON job_skills
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_skills.job_id
      AND jobs.is_published = true
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_job_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_skills_updated_at
  BEFORE UPDATE ON job_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_job_skills_updated_at();

-- Migrate existing SOC-based skills to job-specific skills for featured roles
INSERT INTO job_skills (job_id, skill_id, importance_level)
SELECT 
  j.id as job_id,
  s.id as skill_id,
  3 as importance_level
FROM jobs j
JOIN skills s ON s.soc_code = j.soc_code
WHERE j.job_kind = 'featured_role'
  AND j.soc_code IS NOT NULL
ON CONFLICT (job_id, skill_id) DO NOTHING;
