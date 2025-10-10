-- Sync BLS wage data to jobs table median_wage_usd field
-- This ensures cards and admin editor show the same salary as detail pages

BEGIN;

-- Update existing jobs with BLS wage data (Tampa MSA preferred, then Florida, then National)
UPDATE public.jobs j
SET median_wage_usd = COALESCE(
  (
    SELECT bwd.median_wage
    FROM bls_wage_data bwd
    WHERE bwd.soc_code = j.soc_code
      AND bwd.area_code IN ('45300', '12', '0000000')
    ORDER BY 
      CASE bwd.area_code
        WHEN '45300' THEN 1  -- Tampa MSA (highest priority)
        WHEN '12' THEN 2      -- Florida
        WHEN '0000000' THEN 3 -- National
      END,
      bwd.data_year DESC
    LIMIT 1
  ),
  j.median_wage_usd  -- Keep existing value if no BLS data
)
WHERE j.soc_code IS NOT NULL
  AND j.soc_code != '';

-- Create function to auto-sync when BLS data is inserted/updated
CREATE OR REPLACE FUNCTION sync_bls_wage_to_jobs()
RETURNS TRIGGER AS $$
BEGIN
  -- Update jobs table with the new BLS wage data
  UPDATE public.jobs
  SET median_wage_usd = NEW.median_wage
  WHERE soc_code = NEW.soc_code
    AND (median_wage_usd IS NULL OR median_wage_usd = 0);  -- Only update if empty
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync on BLS data insert/update
DROP TRIGGER IF EXISTS trigger_sync_bls_wage_to_jobs ON bls_wage_data;
CREATE TRIGGER trigger_sync_bls_wage_to_jobs
  AFTER INSERT OR UPDATE ON bls_wage_data
  FOR EACH ROW
  WHEN (NEW.area_code = '45300')  -- Only sync Tampa MSA data
  EXECUTE FUNCTION sync_bls_wage_to_jobs();

COMMIT;
