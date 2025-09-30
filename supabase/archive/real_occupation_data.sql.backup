-- Real occupation data from CSV to replace mock high-demand data
-- This will update the jobs table with real occupation data

-- Clear existing job data first
DELETE FROM job_skills;
DELETE FROM jobs;

-- Insert real occupation data from CSV
INSERT INTO jobs (id, title, short_desc, category, median_wage_usd, job_type, location_city, location_state, is_featured, is_high_demand, created_at) VALUES
('job-1', 'Electricians', 'Installs and maintains wiring systems in residential, commercial, and industrial settings.', 'Skilled Trades', 48640, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-2', 'Carpenters', 'Constructs, installs, and repairs building frameworks and structures.', 'Skilled Trades', 45040, 'Full-time', 'St. Petersburg', 'FL', false, true, now()),
('job-3', 'Project Management Specialists', 'Oversees projects, resources, and teams to meet deadlines and goals across industries.', 'Business', 86040, 'Full-time', 'Tampa', 'FL', true, true, now()),
('job-4', 'Software Developers', 'Designs and builds computer software and applications for user and business needs.', 'Tech & Services', 99180, 'Full-time', 'Clearwater', 'FL', true, true, now()),
('job-5', 'HR Specialists', 'Manages hiring, onboarding, employee relations, and compliance with labor laws.', 'Business', 64020, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-6', 'Sales Reps (Services)', 'Sells business services such as software, consulting, or logistics to organizations.', 'Business', 60210, 'Full-time', 'St. Petersburg', 'FL', false, true, now()),
('job-7', 'Bookkeeping & Auditing Clerks', 'Maintains financial records, processes invoices, and assists with audits.', 'Finance & Legal', 45590, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-8', 'Computer User Support Specialists', 'Provides technical assistance and support to users on software and hardware.', 'Tech & Services', 50690, 'Full-time', 'Clearwater', 'FL', false, true, now()),
('job-9', 'General & Operations Managers', 'Directs daily business operations, manages budgets, and oversees staff.', 'Business', 104930, 'Full-time', 'Tampa', 'FL', true, true, now()),
('job-10', 'Accountants & Auditors', 'Analyzes financial records, prepares reports, and ensures regulatory compliance.', 'Finance & Legal', 69490, 'Full-time', 'St. Petersburg', 'FL', false, true, now()),
('job-11', 'Sales Reps, Wholesale/Manufacturing', 'Sells products to businesses and government agencies, often involving technical goods.', 'Business', 65120, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-12', 'First-Line Supervisors, Construction Trades', 'Oversees construction crews, schedules tasks, and ensures safety and code compliance.', 'Skilled Trades', 71460, 'Full-time', 'St. Petersburg', 'FL', true, true, now()),
('job-13', 'Maintenance & Repair Workers, General', 'Performs routine and preventive maintenance on equipment, buildings, and machinery.', 'Skilled Trades', 39790, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-14', 'Registered Nurses (RNs)', 'Provides patient care, educates about health conditions, and supports recovery.', 'Health & Education', 79910, 'Full-time', 'Clearwater', 'FL', true, true, now()),
('job-15', 'Construction Laborers', 'Assists in physical construction tasks including site prep, digging, loading, and cleanup.', 'Skilled Trades', 37140, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-16', 'HVAC Mechanics & Installers', 'Installs, maintains, and repairs heating, ventilation, and air conditioning systems.', 'Skilled Trades', 48630, 'Full-time', 'St. Petersburg', 'FL', false, true, now()),
('job-17', 'Medical Assistants', 'Supports doctors by taking vitals, updating records, and assisting in procedures.', 'Health & Education', 37420, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-18', 'Nursing Assistants', 'Helps patients with daily tasks such as bathing and mobility under nurse supervision.', 'Health & Education', 36710, 'Full-time', 'Clearwater', 'FL', false, true, now()),
('job-19', 'Cooks, Restaurant', 'Prepares meals according to recipes and customer orders in commercial kitchens.', 'Hospitality', 31310, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-20', 'Customer Service Representatives', 'Assists customers via phone, email, or chat, resolving issues and providing support.', 'Business', 37850, 'Full-time', 'St. Petersburg', 'FL', false, true, now()),
('job-21', 'Light Truck Drivers', 'Transports goods using vans or smaller delivery trucks on short-distance routes.', 'Logistics', 38910, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-22', 'Heavy & Tractor-Trailer Truck Drivers', 'Drives long-haul commercial trucks for cargo delivery between regions or states.', 'Logistics', 46350, 'Full-time', 'Clearwater', 'FL', false, true, now()),
('job-23', 'Childcare Workers', 'Cares for young children in homes, schools, or daycare centers, supporting development.', 'Health & Education', 27390, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-24', 'Preschool Teachers (except Special Ed)', 'Teaches foundational skills and early learning for children aged 3–5.', 'Health & Education', 35040, 'Full-time', 'St. Petersburg', 'FL', false, true, now()),
('job-25', 'Security Guards', 'Patrols properties, monitors surveillance, and enforces rules to maintain safety.', 'Public Services', 32520, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-26', 'Police & Sheriff''s Patrol Officers', 'Enforces laws, responds to emergencies, and conducts investigations in communities.', 'Public Services', 67660, 'Full-time', 'Clearwater', 'FL', true, true, now()),
('job-27', 'Medical Secretaries & Admin Assistants', 'Schedules appointments, manages records, and handles office tasks in medical settings.', 'Health & Education', 37470, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-28', 'Phlebotomists', 'Draws blood for tests, transfusions, or donations in clinical settings.', 'Health & Education', 37440, 'Full-time', 'St. Petersburg', 'FL', false, true, now()),
('job-29', 'Medical Records Specialists', 'Manages, codes, and secures patient records in compliance with regulations.', 'Health & Education', 47290, 'Full-time', 'Tampa', 'FL', false, true, now()),
('job-30', 'Dental Assistants', 'Prepares exam rooms, assists dentists, and educates patients on oral care.', 'Health & Education', 41020, 'Full-time', 'Clearwater', 'FL', false, true, now());

-- Link jobs to companies (using existing companies from seed data)
UPDATE jobs SET company_id = 'comp-1' WHERE id IN ('job-1', 'job-2', 'job-12', 'job-13', 'job-15', 'job-16'); -- Power Design for construction/trades
UPDATE jobs SET company_id = 'comp-2' WHERE id IN ('job-4', 'job-8'); -- TD SYNNEX for tech
UPDATE jobs SET company_id = 'comp-3' WHERE id IN ('job-14', 'job-17', 'job-18', 'job-28', 'job-30'); -- BayCare for healthcare
UPDATE jobs SET company_id = 'comp-4' WHERE id IN ('job-3', 'job-5', 'job-9'); -- Raymond James for business
UPDATE jobs SET company_id = 'comp-5' WHERE id IN ('job-6', 'job-11', 'job-20'); -- Jabil for sales/service
UPDATE jobs SET company_id = 'comp-6' WHERE id IN ('job-7', 'job-10', 'job-27', 'job-29'); -- Honeywell for admin/finance
UPDATE jobs SET company_id = 'comp-7' WHERE id IN ('job-19'); -- Restaurant jobs
UPDATE jobs SET company_id = 'comp-8' WHERE id IN ('job-21', 'job-22'); -- Logistics companies
UPDATE jobs SET company_id = 'comp-9' WHERE id IN ('job-23', 'job-24'); -- Education companies
UPDATE jobs SET company_id = 'comp-10' WHERE id IN ('job-25', 'job-26'); -- Public safety

-- Add some job-skill relationships for the new jobs
-- Link jobs to relevant skills (using existing skills from seed data)
INSERT INTO job_skills (job_id, skill_id, weight, created_at) VALUES
-- Electricians
('job-1', 'skill-1', 0.9, now()), -- Electrical Systems
('job-1', 'skill-2', 0.8, now()), -- Safety Protocols
('job-1', 'skill-3', 0.7, now()), -- Blueprint Reading

-- Software Developers  
('job-4', 'skill-4', 0.9, now()), -- Programming
('job-4', 'skill-5', 0.8, now()), -- Problem Solving
('job-4', 'skill-6', 0.8, now()), -- Software Design

-- Project Management Specialists
('job-3', 'skill-7', 0.9, now()), -- Project Planning
('job-3', 'skill-8', 0.8, now()), -- Team Leadership
('job-3', 'skill-9', 0.7, now()), -- Risk Management

-- Registered Nurses
('job-14', 'skill-10', 0.9, now()), -- Patient Care
('job-14', 'skill-11', 0.8, now()), -- Medical Knowledge
('job-14', 'skill-12', 0.8, now()), -- Communication

-- General & Operations Managers
('job-9', 'skill-8', 0.9, now()), -- Team Leadership
('job-9', 'skill-13', 0.8, now()), -- Business Operations
('job-9', 'skill-14', 0.7, now()); -- Strategic Planning
