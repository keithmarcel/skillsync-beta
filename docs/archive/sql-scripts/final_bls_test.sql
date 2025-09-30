SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: admin_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."companies" ("id", "name", "logo_url", "is_trusted_partner", "hq_city", "hq_state", "revenue_range", "employee_range", "industry", "bio", "company_image_url") VALUES
	('660e8400-e29b-41d4-a716-446655440001', 'BayCareTech', '/companies/Baycare.svg', true, 'Clearwater', 'FL', '$1B+', '10000+', 'Healthcare', 'Leading healthcare system providing comprehensive medical services and innovative patient care solutions across the Tampa Bay region.', NULL),
	('660e8400-e29b-41d4-a716-446655440002', 'Honeywell Aerospace', '/companies/Honeywell.svg', true, 'Clearwater', 'FL', '$1B+', '5000-10000', 'Aerospace', 'Global leader in aerospace technologies, providing advanced solutions for commercial and defense applications.', NULL),
	('660e8400-e29b-41d4-a716-446655440003', 'Florida Health Partners', '/companies/Baycare.svg', true, 'St. Petersburg', 'FL', '$1B+', '5000-10000', 'Healthcare', 'Comprehensive healthcare network offering medical services, research, and community health programs throughout Florida.', NULL),
	('660e8400-e29b-41d4-a716-446655440004', 'Jabil Inc.', '/companies/Jabil.svg', true, 'St. Petersburg', 'FL', '$1B+', '10000+', 'Manufacturing', 'Global manufacturing services company providing comprehensive design, manufacturing, and supply chain solutions.', NULL),
	('660e8400-e29b-41d4-a716-446655440005', 'Raymond James Financial', '/companies/raymondjames.svg', true, 'St. Petersburg', 'FL', '$1B+', '5000-10000', 'Financial Services', 'Leading investment services firm providing financial planning, wealth management, and investment banking services.', NULL);


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."jobs" ("id", "job_kind", "title", "soc_code", "company_id", "job_type", "category", "location_city", "location_state", "median_wage_usd", "long_desc", "featured_image_url", "skills_count", "required_proficiency_pct", "is_featured", "employment_outlook", "education_level", "work_experience", "on_job_training", "job_openings_annual", "growth_rate_percent", "created_at", "updated_at", "status") VALUES
	('880e8400-e29b-41d4-a716-446655440001', 'occupation', 'General & Operations Managers', '11-1021', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 3, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440002', 'occupation', 'Bookkeeping, Accounting & Auditing Clerks', '43-3031', NULL, 'Full-time', 'Finance & Legal', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440003', 'occupation', 'Registered Nurses', '29-1141', NULL, 'Full-time', 'Health & Education', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440004', 'occupation', 'Sales Representatives of Services (except advertising, insurance, financial, travel)', '41-3091', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440005', 'occupation', 'Heavy & Tractor-Trailer Truck Drivers', '53-3032', NULL, 'Full-time', 'Logistics', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440006', 'occupation', 'Accountants & Auditors', '13-2011', NULL, 'Full-time', 'Finance & Legal', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440007', 'occupation', 'Management Analysts', '13-1111', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440008', 'occupation', 'First-Line Supervisors of Office & Administrative Support Workers', '43-1011', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440009', 'occupation', 'Software Developers', '15-1252', NULL, 'Full-time', 'Tech & Services', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440010', 'occupation', 'Sales Representatives, Wholesale & Manufacturing (except technical & scientific products)', '41-4012', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440011', 'occupation', 'Insurance Sales Agents', '41-3021', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440012', 'occupation', 'Market Research Analysts & Marketing Specialists', '13-1161', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440013', 'occupation', 'First-Line Supervisors of Retail Sales Workers', '41-1011', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440014', 'occupation', 'Business Operations Specialists, All Other', '13-1199', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440015', 'occupation', 'Human Resources Specialists', '13-1071', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440016', 'occupation', 'Project Management Specialists', '13-1082', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440017', 'occupation', 'Real Estate Sales Agents', '41-9022', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440018', 'occupation', 'First-Line Supervisors of Construction Trades & Extraction Workers', '47-1011', NULL, 'Full-time', 'Skilled Trades', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440019', 'occupation', 'Carpenters', '47-2031', NULL, 'Full-time', 'Skilled Trades', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440020', 'occupation', 'Computer User Support Specialists', '15-1232', NULL, 'Full-time', 'Tech & Services', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440021', 'occupation', 'Claims Adjusters, Examiners, & Investigators', '13-1031', NULL, 'Full-time', 'Finance & Legal', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440022', 'occupation', 'Electricians', '47-2111', NULL, 'Full-time', 'Skilled Trades', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440023', 'occupation', 'Managers, All Other', '11-9199', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440024', 'occupation', 'Paralegals & Legal Assistants', '23-2011', NULL, 'Full-time', 'Finance & Legal', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440025', 'occupation', 'Financial Managers', '11-3031', NULL, 'Full-time', 'Finance & Legal', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440026', 'occupation', 'Medical & Health Services Managers', '11-9111', NULL, 'Full-time', 'Health & Education', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440027', 'occupation', 'Elementary School Teachers (except special & career/technical education)', '25-2021', NULL, 'Full-time', 'Health & Education', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440028', 'occupation', 'Securities, Commodities & Financial Services Sales Agents', '41-3031', NULL, 'Full-time', 'Finance & Legal', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440029', 'occupation', 'Licensed Practical & Licensed Vocational Nurses', '29-2061', NULL, 'Full-time', 'Health & Education', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published'),
	('880e8400-e29b-41d4-a716-446655440030', 'occupation', 'Property, Real Estate & Community Association Managers', '11-9141', NULL, 'Full-time', 'Business', 'Pinellas County', 'FL', NULL, 'API_NEEDED: Long description from O*NET', NULL, 0, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-28 21:24:37.749138+00', '2025-09-28 21:24:37.749138+00', 'published');


--
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."skills" ("id", "name", "onet_id", "category", "description", "lightcast_id", "source", "source_version") VALUES
	('550e8400-e29b-41d4-a716-446655440001', 'JavaScript Programming', '15-1252.00', 'Technical', 'Programming in JavaScript for web development', 'KS120676', 'ONET/LIGHTCAST', '28.2'),
	('550e8400-e29b-41d4-a716-446655440002', 'React Framework', '15-1252.00', 'Technical', 'Building user interfaces with React', 'KS1275B6', 'ONET/LIGHTCAST', '28.2'),
	('550e8400-e29b-41d4-a716-446655440003', 'Node.js Development', '15-1252.00', 'Technical', 'Server-side JavaScript development', 'KS127C89', 'ONET/LIGHTCAST', '28.2'),
	('550e8400-e29b-41d4-a716-446655440004', 'Database Management', '15-1241.00', 'Technical', 'Managing and querying databases', 'KS120A45', 'ONET/LIGHTCAST', '28.2'),
	('550e8400-e29b-41d4-a716-446655440005', 'Project Management', '11-9021.00', 'Soft Skills', 'Planning and executing projects', 'KS440156', 'ONET/LIGHTCAST', '28.2'),
	('550e8400-e29b-41d4-a716-446655440006', 'Communication', '11-9021.00', 'Soft Skills', 'Effective verbal and written communication', 'KS440789', 'ONET/LIGHTCAST', '28.2'),
	('550e8400-e29b-41d4-a716-446655440007', 'Problem Solving', '11-9021.00', 'Soft Skills', 'Analytical thinking and problem resolution', 'KS441234', 'ONET/LIGHTCAST', '28.2'),
	('550e8400-e29b-41d4-a716-446655440008', 'Python Programming', '15-1252.00', 'Technical', 'Programming in Python for various applications', 'KS120677', 'ONET/LIGHTCAST', '28.2'),
	('550e8400-e29b-41d4-a716-446655440009', 'Data Analysis', '15-1211.00', 'Technical', 'Analyzing and interpreting data', 'KS125678', 'ONET/LIGHTCAST', '28.2'),
	('550e8400-e29b-41d4-a716-446655440010', 'Machine Learning', '15-1211.00', 'Technical', 'Developing ML models and algorithms', 'KS125679', 'ONET/LIGHTCAST', '28.2');


--
-- Data for Name: assessment_skill_results; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: bls_employment_projections; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: bls_wage_data; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cip_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."cip_codes" ("cip_code", "title", "level") VALUES
	('11.0701', 'Computer Science', 'Bachelor'),
	('11.0801', 'Web Page, Digital/Multimedia and Information Resources Design', 'Bachelor'),
	('52.0201', 'Business Administration and Management, General', 'Bachelor'),
	('14.0901', 'Computer Engineering, General', 'Bachelor');


--
-- Data for Name: cip_soc_crosswalk; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."cip_soc_crosswalk" ("cip_code", "soc_code", "source") VALUES
	('11.0701', '15-1252.00', 'ONET'),
	('11.0801', '15-1134.00', 'ONET'),
	('52.0201', '11-9021.00', 'ONET'),
	('14.0901', '17-2061.00', 'ONET');


--
-- Data for Name: company_job_openings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."company_job_openings" ("id", "company_id", "external_job_title", "soc_code", "apply_url", "region_code") VALUES
	('c0111111-1111-1111-1111-111111111111', '660e8400-e29b-41d4-a716-446655440001', 'Senior Full Stack Developer', '15-1252.00', 'https://techcorp.com/careers/senior-fullstack', 'FL-Tampa'),
	('c0222222-2222-2222-2222-222222222222', '660e8400-e29b-41d4-a716-446655440002', 'Clinical Data Analyst', '15-1211.00', 'https://baycare.org/careers/data-analyst', 'FL-Clearwater');


--
-- Data for Name: company_users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cos_certifications_cache; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cos_programs_cache; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: job_skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."job_skills" ("job_id", "skill_id", "weight") VALUES
	('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 1.0),
	('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 0.9),
	('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 0.8);


--
-- Data for Name: occupation_enrichment_status; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."schools" ("id", "name", "logo_url", "about_url", "city", "state") VALUES
	('770e8400-e29b-41d4-a716-446655440001', 'University of South Florida', '/schools/USF.svg', 'https://www.usf.edu/about/', 'Tampa', 'FL'),
	('770e8400-e29b-41d4-a716-446655440002', 'Pinellas Technical College', '/schools/ptec.png', 'https://www.myptec.edu/about/', 'St. Petersburg', 'FL'),
	('770e8400-e29b-41d4-a716-446655440003', 'St. Petersburg College', '/schools/spc.svg', 'https://www.spcollege.edu/about/', 'St. Petersburg', 'FL');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: programs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."programs" ("id", "school_id", "name", "program_type", "format", "duration_text", "short_desc", "program_url", "cip_code", "status") VALUES
	('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Computer Science Bachelor''s Degree', 'Degree', 'On-campus', '4 years', 'Comprehensive computer science program covering programming, algorithms, and software engineering.', 'https://www.usf.edu/engineering/cse/undergraduate/computer-science/', '11.0701', 'published'),
	('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'Web Development Certificate', 'Certificate', 'Hybrid', '6 months', 'Intensive program covering HTML, CSS, JavaScript, and modern web frameworks.', 'https://www.myptec.edu/programs/web-development/', '11.0801', 'published'),
	('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 'Business Administration Associate Degree', 'Degree', 'Online', '2 years', 'Foundation in business principles, management, and organizational behavior.', 'https://www.spcollege.edu/programs/business-administration/', '52.0201', 'published'),
	('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 'Data Analytics Certificate', 'Certificate', 'On-campus', '9 months', 'Learn statistical analysis, data visualization, and machine learning techniques.', 'https://www.usf.edu/continuing-education/programs/data-analytics/', '11.0701', 'published'),
	('990e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', 'Cybersecurity Specialist', 'Certificate', 'Hybrid', '12 months', 'Comprehensive cybersecurity training covering network security, ethical hacking, and compliance.', 'https://www.myptec.edu/programs/cybersecurity/', '11.0701', 'published');


--
-- Data for Name: program_skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."program_skills" ("program_id", "skill_id", "weight") VALUES
	('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 1.0),
	('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440008', 1.0),
	('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 0.9),
	('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 0.8),
	('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 1.0),
	('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 1.0),
	('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 0.7),
	('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008', 1.0),
	('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440009', 1.0),
	('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010', 0.8);


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."quizzes" ("id", "job_id", "estimated_minutes", "version") VALUES
	('a0111111-1111-1111-1111-111111111111', '880e8400-e29b-41d4-a716-446655440001', 20, 1),
	('a0222222-2222-2222-2222-222222222222', '880e8400-e29b-41d4-a716-446655440004', 15, 1);


--
-- Data for Name: quiz_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."quiz_sections" ("id", "quiz_id", "skill_id", "order_index") VALUES
	('b0111111-1111-1111-1111-111111111111', 'a0111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440001', 1),
	('b0222222-2222-2222-2222-222222222222', 'a0111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440002', 2);


--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."quiz_questions" ("id", "section_id", "stem", "choices", "answer_key", "difficulty") VALUES
	('d0111111-1111-1111-1111-111111111111', 'b0111111-1111-1111-1111-111111111111', 'Which of the following is a JavaScript framework?', '["React", "Python", "SQL", "HTML"]', 'React', 'easy'),
	('d0222222-2222-2222-2222-222222222222', 'b0222222-2222-2222-2222-222222222222', 'What is the virtual DOM in React?', '["A copy of the real DOM", "A database", "A server", "A programming language"]', 'A copy of the real DOM', 'medium');


--
-- Data for Name: quiz_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: resume_features; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: skill_aliases; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."skill_aliases" ("skill_id", "alias") VALUES
	('550e8400-e29b-41d4-a716-446655440001', 'JS'),
	('550e8400-e29b-41d4-a716-446655440001', 'ECMAScript'),
	('550e8400-e29b-41d4-a716-446655440002', 'ReactJS'),
	('550e8400-e29b-41d4-a716-446655440003', 'NodeJS'),
	('550e8400-e29b-41d4-a716-446655440008', 'Python3');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
