-- SkillSync Database Seed Data
-- This file populates the database with comprehensive test data matching the documented data structure

-- Clear existing data (in reverse dependency order)
DELETE FROM assessment_skill_results;
DELETE FROM quiz_responses;
DELETE FROM quiz_questions;
DELETE FROM quiz_sections;
DELETE FROM quizzes;
DELETE FROM resume_features;
DELETE FROM assessments;
DELETE FROM favorites;
DELETE FROM feedback;
DELETE FROM job_skills;
DELETE FROM program_skills;
DELETE FROM skill_aliases;
DELETE FROM company_job_openings;
DELETE FROM jobs;
DELETE FROM companies;
DELETE FROM programs;
DELETE FROM schools;
DELETE FROM cip_soc_crosswalk;
DELETE FROM cip_codes;
DELETE FROM skills;
DELETE FROM profiles;

-- Insert Skills (foundational data)
INSERT INTO skills (id, name, onet_id, category, description, lightcast_id, source, source_version) VALUES
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

-- Insert CIP Codes
INSERT INTO cip_codes (cip_code, title, level) VALUES
('11.0701', 'Computer Science', 'Bachelor'),
('11.0801', 'Web Page, Digital/Multimedia and Information Resources Design', 'Bachelor'),
('52.0201', 'Business Administration and Management, General', 'Bachelor'),
('14.0901', 'Computer Engineering, General', 'Bachelor');

-- Insert CIP-SOC Crosswalk
INSERT INTO cip_soc_crosswalk (cip_code, soc_code, source) VALUES
('11.0701', '15-1252.00', 'ONET'),
('11.0801', '15-1134.00', 'ONET'),
('52.0201', '11-9021.00', 'ONET'),
('14.0901', '17-2061.00', 'ONET');

-- Insert Companies
INSERT INTO companies (id, name, logo_url, is_trusted_partner, hq_city, hq_state, revenue_range, employee_range, industry, bio) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'BayCareTech', '/companies/Baycare.svg', true, 'Clearwater', 'FL', '$1B+', '10000+', 'Healthcare', 'Leading healthcare system providing comprehensive medical services and innovative patient care solutions across the Tampa Bay region.'),
('660e8400-e29b-41d4-a716-446655440002', 'Honeywell Aerospace', '/companies/Honeywell.svg', true, 'Clearwater', 'FL', '$1B+', '5000-10000', 'Aerospace', 'Global leader in aerospace technologies, providing advanced solutions for commercial and defense applications.'),
('660e8400-e29b-41d4-a716-446655440003', 'Florida Health Partners', '/companies/Baycare.svg', true, 'St. Petersburg', 'FL', '$1B+', '5000-10000', 'Healthcare', 'Comprehensive healthcare network offering medical services, research, and community health programs throughout Florida.'),
('660e8400-e29b-41d4-a716-446655440004', 'Jabil Inc.', '/companies/Jabil.svg', true, 'St. Petersburg', 'FL', '$1B+', '10000+', 'Manufacturing', 'Global manufacturing services company providing comprehensive design, manufacturing, and supply chain solutions.'),
('660e8400-e29b-41d4-a716-446655440005', 'Raymond James Financial', '/companies/raymondjames.svg', true, 'St. Petersburg', 'FL', '$1B+', '5000-10000', 'Financial Services', 'Leading investment services firm providing financial planning, wealth management, and investment banking services.');

-- Insert Schools
INSERT INTO schools (id, name, logo_url, about_url, city, state) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'University of South Florida', '/schools/USF.svg', 'https://www.usf.edu/about/', 'Tampa', 'FL'),
('770e8400-e29b-41d4-a716-446655440002', 'Pinellas Technical College', '/schools/ptec.png', 'https://www.myptec.edu/about/', 'St. Petersburg', 'FL'),
('770e8400-e29b-41d4-a716-446655440003', 'St. Petersburg College', '/schools/spc.svg', 'https://www.spcollege.edu/about/', 'St. Petersburg', 'FL');

-- Insert Jobs with real occupation data from CSV
INSERT INTO jobs (id, job_kind, title, long_desc, category, median_wage_usd, job_type, location_city, location_state, company_id) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'high_demand', 'Electricians', 'Installs and maintains wiring systems in residential, commercial, and industrial settings.', 'Skilled Trades', 48640, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440002', 'high_demand', 'Carpenters', 'Constructs, installs, and repairs building frameworks and structures.', 'Skilled Trades', 45040, 'Full-time', 'St. Petersburg', 'FL', '660e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440003', 'featured_role', 'Project Management Specialists', 'Oversees projects, resources, and teams to meet deadlines and goals across industries.', 'Business', 86040, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440004'),
('880e8400-e29b-41d4-a716-446655440004', 'featured_role', 'Software Developers', 'Designs and builds computer software and applications for user and business needs.', 'Tech & Services', 99180, 'Full-time', 'Clearwater', 'FL', '660e8400-e29b-41d4-a716-446655440002'),
('880e8400-e29b-41d4-a716-446655440005', 'high_demand', 'HR Specialists', 'Manages hiring, onboarding, employee relations, and compliance with labor laws.', 'Business', 64020, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440004'),
('880e8400-e29b-41d4-a716-446655440006', 'high_demand', 'Sales Reps (Services)', 'Sells business services such as software, consulting, or logistics to organizations.', 'Business', 60210, 'Full-time', 'St. Petersburg', 'FL', '660e8400-e29b-41d4-a716-446655440005'),
('880e8400-e29b-41d4-a716-446655440007', 'high_demand', 'Bookkeeping & Auditing Clerks', 'Maintains financial records, processes invoices, and assists with audits.', 'Finance & Legal', 45590, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440005'),
('880e8400-e29b-41d4-a716-446655440008', 'high_demand', 'Computer User Support Specialists', 'Provides technical assistance and support to users on software and hardware.', 'Tech & Services', 50690, 'Full-time', 'Clearwater', 'FL', '660e8400-e29b-41d4-a716-446655440002'),
('880e8400-e29b-41d4-a716-446655440009', 'featured_role', 'General & Operations Managers', 'Directs daily business operations, manages budgets, and oversees staff.', 'Business', 104930, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440004'),
('880e8400-e29b-41d4-a716-446655440010', 'high_demand', 'Accountants & Auditors', 'Analyzes financial records, prepares reports, and ensures regulatory compliance.', 'Finance & Legal', 69490, 'Full-time', 'St. Petersburg', 'FL', '660e8400-e29b-41d4-a716-446655440005'),
('880e8400-e29b-41d4-a716-446655440011', 'high_demand', 'Sales Reps, Wholesale/Manufacturing', 'Sells products to businesses and government agencies, often involving technical goods.', 'Business', 65120, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440005'),
('880e8400-e29b-41d4-a716-446655440012', 'featured_role', 'First-Line Supervisors, Construction Trades', 'Oversees construction crews, schedules tasks, and ensures safety and code compliance.', 'Skilled Trades', 71460, 'Full-time', 'St. Petersburg', 'FL', '660e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440013', 'high_demand', 'Maintenance & Repair Workers, General', 'Performs routine and preventive maintenance on equipment, buildings, and machinery.', 'Skilled Trades', 39790, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440014', 'featured_role', 'Registered Nurses (RNs)', 'Provides patient care, educates about health conditions, and supports recovery.', 'Health & Education', 79910, 'Full-time', 'Clearwater', 'FL', '660e8400-e29b-41d4-a716-446655440003'),
('880e8400-e29b-41d4-a716-446655440015', 'high_demand', 'Construction Laborers', 'Assists in physical construction tasks including site prep, digging, loading, and cleanup.', 'Skilled Trades', 37140, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440016', 'high_demand', 'HVAC Mechanics & Installers', 'Installs, maintains, and repairs heating, ventilation, and air conditioning systems.', 'Skilled Trades', 48630, 'Full-time', 'St. Petersburg', 'FL', '660e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440017', 'high_demand', 'Medical Assistants', 'Supports doctors by taking vitals, updating records, and assisting in procedures.', 'Health & Education', 37420, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440003'),
('880e8400-e29b-41d4-a716-446655440018', 'high_demand', 'Nursing Assistants', 'Helps patients with daily tasks such as bathing and mobility under nurse supervision.', 'Health & Education', 36710, 'Full-time', 'Clearwater', 'FL', '660e8400-e29b-41d4-a716-446655440003'),
('880e8400-e29b-41d4-a716-446655440019', 'high_demand', 'Cooks, Restaurant', 'Prepares meals according to recipes and customer orders in commercial kitchens.', 'Hospitality', 31310, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440020', 'high_demand', 'Customer Service Representatives', 'Assists customers via phone, email, or chat, resolving issues and providing support.', 'Business', 37850, 'Full-time', 'St. Petersburg', 'FL', '660e8400-e29b-41d4-a716-446655440005'),
('880e8400-e29b-41d4-a716-446655440021', 'high_demand', 'Light Truck Drivers', 'Transports goods using vans or smaller delivery trucks on short-distance routes.', 'Logistics', 38910, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440022', 'high_demand', 'Heavy & Tractor-Trailer Truck Drivers', 'Drives long-haul commercial trucks for cargo delivery between regions or states.', 'Logistics', 46350, 'Full-time', 'Clearwater', 'FL', '660e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440023', 'high_demand', 'Childcare Workers', 'Cares for young children in homes, schools, or daycare centers, supporting development.', 'Health & Education', 27390, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440003'),
('880e8400-e29b-41d4-a716-446655440024', 'high_demand', 'Preschool Teachers (except Special Ed)', 'Teaches foundational skills and early learning for children aged 3–5.', 'Health & Education', 35040, 'Full-time', 'St. Petersburg', 'FL', '660e8400-e29b-41d4-a716-446655440003'),
('880e8400-e29b-41d4-a716-446655440025', 'high_demand', 'Security Guards', 'Patrols properties, monitors surveillance, and enforces rules to maintain safety.', 'Public Services', 32520, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440026', 'featured_role', 'Police & Sheriff''s Patrol Officers', 'Enforces laws, responds to emergencies, and conducts investigations in communities.', 'Public Services', 67660, 'Full-time', 'Clearwater', 'FL', '660e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440027', 'high_demand', 'Medical Secretaries & Admin Assistants', 'Schedules appointments, manages records, and handles office tasks in medical settings.', 'Health & Education', 37470, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440003'),
('880e8400-e29b-41d4-a716-446655440028', 'high_demand', 'Phlebotomists', 'Draws blood for tests, transfusions, or donations in clinical settings.', 'Health & Education', 37440, 'Full-time', 'St. Petersburg', 'FL', '660e8400-e29b-41d4-a716-446655440003'),
('880e8400-e29b-41d4-a716-446655440029', 'high_demand', 'Medical Records Specialists', 'Manages, codes, and secures patient records in compliance with regulations.', 'Health & Education', 47290, 'Full-time', 'Tampa', 'FL', '660e8400-e29b-41d4-a716-446655440003'),
('880e8400-e29b-41d4-a716-446655440030', 'high_demand', 'Dental Assistants', 'Prepares exam rooms, assists dentists, and educates patients on oral care.', 'Health & Education', 41020, 'Full-time', 'Clearwater', 'FL', '660e8400-e29b-41d4-a716-446655440003');

-- Insert Programs
INSERT INTO programs (id, school_id, name, program_type, format, duration_text, short_desc, program_url, cip_code) VALUES
('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Computer Science Bachelor''s Degree', 'Degree', 'On-campus', '4 years', 'Comprehensive computer science program covering programming, algorithms, and software engineering.', 'https://www.usf.edu/engineering/cse/undergraduate/computer-science/', '11.0701'),
('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'Web Development Certificate', 'Certificate', 'Hybrid', '6 months', 'Intensive program covering HTML, CSS, JavaScript, and modern web frameworks.', 'https://www.myptec.edu/programs/web-development/', '11.0801'),
('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 'Business Administration Associate Degree', 'Degree', 'Online', '2 years', 'Foundation in business principles, management, and organizational behavior.', 'https://www.spcollege.edu/programs/business-administration/', '52.0201'),
('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 'Data Analytics Certificate', 'Certificate', 'On-campus', '9 months', 'Learn statistical analysis, data visualization, and machine learning techniques.', 'https://www.usf.edu/continuing-education/programs/data-analytics/', '11.0701'),
('990e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', 'Cybersecurity Specialist', 'Certificate', 'Hybrid', '12 months', 'Comprehensive cybersecurity training covering network security, ethical hacking, and compliance.', 'https://www.myptec.edu/programs/cybersecurity/', '11.0701');

-- Insert Job Skills relationships
INSERT INTO job_skills (job_id, skill_id, weight) VALUES
-- Senior Software Engineer
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 1.0), -- JavaScript
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 1.0), -- React
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 0.8), -- Node.js
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 0.7), -- Database
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 0.6), -- Project Management
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 0.8), -- Communication
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 0.9), -- Problem Solving
-- Healthcare Data Analyst
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', 1.0), -- Python
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440009', 1.0), -- Data Analysis
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 0.8), -- Database
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 0.7), -- Communication
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', 0.8), -- Problem Solving
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', 0.6), -- Machine Learning
-- Web Developer
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 1.0), -- JavaScript
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 0.8), -- React
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', 0.6), -- Communication
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007', 0.7), -- Problem Solving
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 0.5); -- Database

-- Insert Program Skills relationships
INSERT INTO program_skills (program_id, skill_id, weight) VALUES
-- Computer Science Degree
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 1.0), -- JavaScript
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440008', 1.0), -- Python
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 0.9), -- Database
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 0.8), -- Problem Solving
-- Web Development Certificate
('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 1.0), -- JavaScript
('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 1.0), -- React
('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 0.7), -- Node.js
-- Data Analytics Certificate
('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008', 1.0), -- Python
('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440009', 1.0), -- Data Analysis
('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010', 0.8); -- Machine Learning

-- Note: User profiles, assessments, and favorites require authenticated users
-- These will be created when users sign up and use the application

-- Insert sample quizzes
INSERT INTO quizzes (id, job_id, estimated_minutes, version) VALUES
('a0111111-1111-1111-1111-111111111111', '880e8400-e29b-41d4-a716-446655440001', 20, 1),
('a0222222-2222-2222-2222-222222222222', '880e8400-e29b-41d4-a716-446655440004', 15, 1);

-- Insert quiz sections
INSERT INTO quiz_sections (id, quiz_id, skill_id, order_index) VALUES
('b0111111-1111-1111-1111-111111111111', 'a0111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440001', 1),
('b0222222-2222-2222-2222-222222222222', 'a0111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440002', 2);

-- Insert sample quiz questions
INSERT INTO quiz_questions (id, section_id, stem, choices, answer_key, difficulty) VALUES
('d0111111-1111-1111-1111-111111111111', 'b0111111-1111-1111-1111-111111111111', 'Which of the following is a JavaScript framework?', '["React", "Python", "SQL", "HTML"]', 'React', 'easy'),
('d0222222-2222-2222-2222-222222222222', 'b0222222-2222-2222-2222-222222222222', 'What is the virtual DOM in React?', '["A copy of the real DOM", "A database", "A server", "A programming language"]', 'A copy of the real DOM', 'medium');

-- Insert skill aliases for better search
INSERT INTO skill_aliases (skill_id, alias) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'JS'),
('550e8400-e29b-41d4-a716-446655440001', 'ECMAScript'),
('550e8400-e29b-41d4-a716-446655440002', 'ReactJS'),
('550e8400-e29b-41d4-a716-446655440003', 'NodeJS'),
('550e8400-e29b-41d4-a716-446655440008', 'Python3');

-- Insert company job openings
INSERT INTO company_job_openings (id, company_id, external_job_title, soc_code, apply_url, region_code) VALUES
('c0111111-1111-1111-1111-111111111111', '660e8400-e29b-41d4-a716-446655440001', 'Senior Full Stack Developer', '15-1252.00', 'https://techcorp.com/careers/senior-fullstack', 'FL-Tampa'),
('c0222222-2222-2222-2222-222222222222', '660e8400-e29b-41d4-a716-446655440002', 'Clinical Data Analyst', '15-1211.00', 'https://baycare.org/careers/data-analyst', 'FL-Clearwater');

-- Update skills count for jobs (this would normally be handled by triggers)
UPDATE jobs SET skills_count = (
    SELECT COUNT(*) FROM job_skills WHERE job_skills.job_id = jobs.id
) WHERE id IN (
    '880e8400-e29b-41d4-a716-446655440001',
    '880e8400-e29b-41d4-a716-446655440002',
    '880e8400-e29b-41d4-a716-446655440003',
    '880e8400-e29b-41d4-a716-446655440004',
    '880e8400-e29b-41d4-a716-446655440005',
    '880e8400-e29b-41d4-a716-446655440006'
);
