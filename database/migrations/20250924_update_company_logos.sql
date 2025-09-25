-- Migration: Update company logos with existing assets
-- Date: 2025-09-24
-- Purpose: Add logo URLs to companies table using existing public assets

BEGIN;

-- Check if migration already executed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.migrations WHERE name = '20250924_update_company_logos') THEN
    RAISE NOTICE 'Migration 20250924_update_company_logos already executed';
    RETURN;
  END IF;

  -- Update company logos with existing assets from public/companies/
  UPDATE companies 
  SET logo_url = CASE 
    WHEN name = 'Raymond James' THEN '/companies/raymond-james.svg'
    WHEN name = 'BayCare' THEN '/companies/Baycare.svg'
    WHEN name = 'Honeywell' THEN '/companies/Honeywell.svg'
    WHEN name = 'Jabil' THEN '/companies/Jabil.svg'
    WHEN name = 'TECO' THEN '/companies/TECO.svg'
    WHEN name = 'Power Design' THEN '/companies/power-design.svg'
    WHEN name = 'Spectrum' THEN '/companies/spectrum.svg'
    WHEN name = 'TD SYNNEX' THEN '/companies/td-synnexx.svg'
    WHEN name = 'Charter Communications' THEN '/companies/charter-comms.svg'
    WHEN name = 'Raytheon' THEN '/companies/raytheon.svg'
    WHEN name = 'RTX' THEN '/companies/rtx.svg'
    ELSE logo_url 
  END
  WHERE name IN (
    'Raymond James', 'BayCare', 'Honeywell', 'Jabil', 'TECO', 
    'Power Design', 'Spectrum', 'TD SYNNEX', 'Charter Communications',
    'Raytheon', 'RTX'
  );

  -- Record migration completion
  INSERT INTO public.migrations (name) VALUES ('20250924_update_company_logos');
  
  RAISE NOTICE 'Migration 20250924_update_company_logos completed successfully';
END $$;

COMMIT;
