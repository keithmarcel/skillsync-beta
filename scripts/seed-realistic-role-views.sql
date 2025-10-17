-- Seed realistic role view tracking data for Power Design
-- This creates actual role_views records from test candidates + anonymous users

-- Get Power Design's company ID and role IDs
WITH power_design AS (
  SELECT id FROM companies WHERE name = 'Power Design'
),
pd_roles AS (
  SELECT 
    j.id as job_id,
    j.title
  FROM jobs j
  WHERE j.company_id = (SELECT id FROM power_design)
    AND j.job_kind = 'featured_role'
),
test_candidates AS (
  SELECT id FROM profiles 
  WHERE email IN (
    'keith-woods@bisk.com',
    'emanuel.highgate@example.com',
    'naomi.blake@example.com',
    'aaliyah.ramirez@example.com',
    'elias.thorne@example.com',
    'fatima.nguyen@example.com'
  )
)

-- Insert realistic view data
-- Each candidate views roles multiple times, plus anonymous views
INSERT INTO public.role_views (job_id, user_id, session_id, viewed_at)
SELECT 
  r.job_id,
  CASE 
    -- 60% of views are from logged-in test candidates
    WHEN random() < 0.6 THEN (SELECT id FROM test_candidates ORDER BY random() LIMIT 1)
    -- 40% are anonymous
    ELSE NULL
  END as user_id,
  'session_' || gen_random_uuid()::text as session_id,
  -- Views spread over last 30 days
  NOW() - (random() * INTERVAL '30 days') as viewed_at
FROM pd_roles r
-- Generate multiple views per role
CROSS JOIN generate_series(1, 
  CASE 
    -- Mechanical Project Manager gets most views (200-300)
    WHEN r.title LIKE '%Mechanical Project Manager%' AND r.title NOT LIKE '%Assistant%' THEN 250 + floor(random() * 50)::int
    -- Assistant PM gets medium views (150-200)
    WHEN r.title LIKE '%Assistant%' THEN 175 + floor(random() * 25)::int
    -- Senior roles get fewer but quality views (120-150)
    ELSE 135 + floor(random() * 15)::int
  END
) as series;

-- Verify the data
SELECT 
  j.title,
  j.views_count,
  COUNT(rv.id) as actual_view_records,
  COUNT(DISTINCT rv.user_id) as unique_users,
  COUNT(CASE WHEN rv.user_id IS NULL THEN 1 END) as anonymous_views
FROM jobs j
LEFT JOIN role_views rv ON rv.job_id = j.id
WHERE j.company_id = (SELECT id FROM companies WHERE name = 'Power Design')
  AND j.job_kind = 'featured_role'
GROUP BY j.id, j.title, j.views_count
ORDER BY j.views_count DESC;

-- Show total summary
SELECT 
  'Power Design' as company,
  COUNT(DISTINCT rv.job_id) as total_roles,
  SUM(j.views_count) as total_views_count,
  COUNT(rv.id) as total_view_records,
  COUNT(DISTINCT rv.user_id) FILTER (WHERE rv.user_id IS NOT NULL) as unique_logged_in_users,
  COUNT(CASE WHEN rv.user_id IS NULL THEN 1 END) as anonymous_views
FROM role_views rv
JOIN jobs j ON j.id = rv.job_id
WHERE j.company_id = (SELECT id FROM companies WHERE name = 'Power Design')
  AND j.job_kind = 'featured_role';
