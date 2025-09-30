-- Mock enrichment data to demonstrate the working system
-- Insert sample BLS wage data for a few occupations

INSERT INTO bls_wage_data (soc_code, area_code, area_name, median_wage, mean_wage, employment_level, employment_rse, wage_rse, data_year) VALUES
('29-1141', '45300', 'Tampa-St. Petersburg-Clearwater, FL', 75420, 78950, 12450, 2.1, 1.8, 2023),
('15-1252', '45300', 'Tampa-St. Petersburg-Clearwater, FL', 89650, 95200, 8920, 3.2, 2.4, 2023),
('13-2011', '45300', 'Tampa-St. Petersburg-Clearwater, FL', 68340, 72100, 5680, 2.8, 2.1, 2023),
('11-1021', '45300', 'Tampa-St. Petersburg-Clearwater, FL', 112450, 125800, 3240, 4.1, 3.2, 2023),
('43-3031', '45300', 'Tampa-St. Petersburg-Clearwater, FL', 42180, 44200, 7890, 2.3, 1.9, 2023);

-- Insert sample BLS employment projections
INSERT INTO bls_employment_projections (soc_code, occupation_title, employment_2022, employment_2032, change_number, change_percent, growth_rate, median_wage_2023, education_level, work_experience, on_job_training) VALUES
('29-1141', 'Registered Nurses', 12450, 14200, 1750, 14.1, 'Much faster than average', 75420, 'Bachelor''s degree', 'None', 'None'),
('15-1252', 'Software Developers', 8920, 11200, 2280, 25.6, 'Much faster than average', 89650, 'Bachelor''s degree', 'None', 'None'),
('13-2011', 'Accountants and Auditors', 5680, 6100, 420, 7.4, 'Faster than average', 68340, 'Bachelor''s degree', 'None', 'None'),
('11-1021', 'General and Operations Managers', 3240, 3450, 210, 6.5, 'As fast as average', 112450, 'Bachelor''s degree', '5 years or more', 'None'),
('43-3031', 'Bookkeeping, Accounting, and Auditing Clerks', 7890, 7650, -240, -3.0, 'Decline', 42180, 'Some college, no degree', 'None', 'Moderate-term on-the-job training');

-- Insert sample CareerOneStop programs
INSERT INTO cos_programs_cache (external_id, soc_code, program_name, provider_name, provider_type, city, state, zip_code, program_type, delivery_method, duration, cost, program_url, cip_code, description) VALUES
('cos-rn-1', '29-1141', 'Registered Nursing Program', 'University of South Florida', 'Public University', 'Tampa', 'FL', '33620', 'Bachelor''s Degree', 'In-Person', '4 years', 28000, 'https://health.usf.edu/nursing', '51.3801', 'Comprehensive nursing program preparing students for RN licensure'),
('cos-rn-2', '29-1141', 'Associate Degree in Nursing', 'St. Petersburg College', 'Community College', 'St. Petersburg', 'FL', '33733', 'Associate Degree', 'Hybrid', '2 years', 12500, 'https://www.spcollege.edu/nursing', '51.3801', 'Two-year ADN program with clinical rotations'),
('cos-sw-1', '15-1252', 'Computer Science Program', 'University of South Florida', 'Public University', 'Tampa', 'FL', '33620', 'Bachelor''s Degree', 'In-Person', '4 years', 32000, 'https://www.usf.edu/engineering/cse/', '11.0701', 'Comprehensive computer science program'),
('cos-sw-2', '15-1252', 'Web Development Bootcamp', 'Pinellas Technical College', 'Technical College', 'St. Petersburg', 'FL', '33710', 'Certificate', 'Hybrid', '6 months', 8500, 'https://www.myptec.edu/programs/web-development/', '11.0801', 'Intensive web development training'),
('cos-acc-1', '13-2011', 'Accounting Program', 'St. Petersburg College', 'Community College', 'St. Petersburg', 'FL', '33733', 'Associate Degree', 'Online', '2 years', 9800, 'https://www.spcollege.edu/programs/business/', '52.0301', 'Comprehensive accounting program');

-- Insert sample CareerOneStop certifications
INSERT INTO cos_certifications_cache (soc_code, certification_name, issuing_organization, description, requirements, renewal_period, cost, exam_required, related_socs) VALUES
('29-1141', 'Registered Nurse License', 'Florida Board of Nursing', 'State license required to practice as a registered nurse in Florida', '["Graduation from approved nursing program", "Pass NCLEX-RN exam"]', '2 years', 120, true, '["29-1141"]'),
('29-1141', 'Basic Life Support (BLS)', 'American Heart Association', 'CPR and basic life support certification', '["Complete BLS course", "Pass skills assessment"]', '2 years', 85, true, '["29-1141"]'),
('15-1252', 'AWS Certified Developer', 'Amazon Web Services', 'Professional certification for cloud developers', '["1+ years AWS experience", "Pass certification exam"]', '3 years', 150, true, '["15-1252"]'),
('15-1252', 'Certified ScrumMaster', 'Scrum Alliance', 'Agile project management certification', '["Attend CSM course", "Pass online assessment"]', '2 years', 1395, true, '["15-1252"]'),
('13-2011', 'Certified Public Accountant (CPA)', 'Florida Board of Accountancy', 'Professional accounting license', '["150 credit hours", "Pass CPA exam", "1 year experience"]', 'Annual', 200, true, '["13-2011"]');
