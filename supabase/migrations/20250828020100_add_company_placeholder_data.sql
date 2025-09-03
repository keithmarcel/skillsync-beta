-- Add placeholder data for company modal fields
UPDATE public.companies 
SET 
  revenue_range = CASE 
    WHEN name = 'Raymond James' THEN '$500M to $1B (USD)'
    WHEN name = 'TECO' THEN '$1 to $5B (USD)' 
    WHEN name = 'Honeywell' THEN '$30+ billion USD'
    WHEN name = 'Jabil' THEN '$25+ billion USD'
    WHEN name = 'BayCare' THEN '$1 to $5B (USD)'
    ELSE revenue_range 
  END,
  employee_range = CASE 
    WHEN name = 'Raymond James' THEN '10,001 to 50,000'
    WHEN name = 'TECO' THEN '1,001 to 5,000'
    WHEN name = 'Honeywell' THEN '100,000+'
    WHEN name = 'Jabil' THEN '200,000+'
    WHEN name = 'BayCare' THEN '25,001 to 50,000'
    ELSE employee_range 
  END,
  hq_city = CASE 
    WHEN name = 'Raymond James' THEN 'St. Petersburg'
    WHEN name = 'TECO' THEN 'Tampa'
    WHEN name = 'Honeywell' THEN 'Charlotte'
    WHEN name = 'Jabil' THEN 'St. Petersburg'
    WHEN name = 'BayCare' THEN 'Clearwater'
    ELSE hq_city 
  END,
  hq_state = CASE 
    WHEN name = 'Raymond James' THEN 'FL'
    WHEN name = 'TECO' THEN 'FL'
    WHEN name = 'Honeywell' THEN 'NC'
    WHEN name = 'Jabil' THEN 'FL'
    WHEN name = 'BayCare' THEN 'FL'
    ELSE hq_state 
  END,
  industry = CASE 
    WHEN name = 'Raymond James' THEN 'Financial Services'
    WHEN name = 'TECO' THEN 'Energy & Utilities'
    WHEN name = 'Honeywell' THEN 'Technology & Manufacturing'
    WHEN name = 'Jabil' THEN 'Manufacturing'
    WHEN name = 'BayCare' THEN 'Healthcare'
    ELSE industry 
  END,
  bio = CASE 
    WHEN name = 'Raymond James' THEN 'Raymond James Financial is a leading diversified financial services company providing private client group, capital markets, asset management and banking services to individuals, corporations and municipalities worldwide.

We design breakthrough solutions that push the limits of what''s possible by harnessing the collaborative power of our teams to elevate experiences and empower the communities where we live and work.'
    WHEN name = 'TECO' THEN 'Tampa Electric Company providing reliable electricity to West Central Florida.'
    WHEN name = 'Honeywell' THEN 'Honeywell is a Fortune 100 technology company that delivers industry-specific solutions including aerospace products and services, building technologies, performance materials and safety solutions worldwide.

We design breakthrough solutions that push the limits of what''s possible by harnessing the collaborative power of our teams to elevate experiences and empower the communities where we live and work.'
    WHEN name = 'Jabil' THEN 'Jabil is a global manufacturing solutions provider with over 100 facilities worldwide. We partner with companies across diverse industries to bring their products to market with speed, innovation and efficiency.'
    WHEN name = 'BayCare' THEN 'BayCare Health System is a leading not-for-profit health care system serving the Tampa Bay and central Florida regions. We operate 15 hospitals and numerous outpatient facilities, providing comprehensive medical care to our communities.'
    ELSE bio 
  END,
  company_image_url = CASE 
    WHEN name = 'Raymond James' THEN '/assets/hero_featured-roles.jpg'
    WHEN name = 'TECO' THEN '/assets/hero_featured-programs.jpg'
    WHEN name = 'Honeywell' THEN '/assets/hero_my-assessments.jpg'
    WHEN name = 'Jabil' THEN '/assets/hero_featured-roles.jpg'
    WHEN name = 'BayCare' THEN '/assets/hero_featured-programs.jpg'
    ELSE company_image_url 
  END
WHERE name IN ('Raymond James', 'TECO', 'Honeywell', 'Jabil', 'BayCare');
