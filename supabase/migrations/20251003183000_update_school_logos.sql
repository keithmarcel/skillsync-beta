-- Update schools table with logo URLs from /public/schools directory
-- This maps school names to their corresponding logo files

-- Bisk Workforce Essentials
UPDATE schools SET logo_url = '/schools/BWE-logo-color.svg' 
WHERE name = 'Bisk Workforce Essentials';

-- Bisk Workforce Essentials: Healthcare
UPDATE schools SET logo_url = '/schools/Bisk Workforce Essentials - Healthcare Lockup Color Lockup.svg' 
WHERE name = 'Bisk Workforce Essentials: Healthcare';

-- Caldwell University
UPDATE schools SET logo_url = '/schools/CAL-logo-horizontal-color (1).svg' 
WHERE name = 'Caldwell University';

-- Eastern Connecticut State University
UPDATE schools SET logo_url = '/schools/ECSU-logo-horizontal-color.svg' 
WHERE name = 'Eastern Connecticut State University';

-- Emory Executive Education
UPDATE schools SET logo_url = '/schools/EMG-logo-horizontal-color.svg' 
WHERE name = 'Emory Executive Education';

-- Emory University
UPDATE schools SET logo_url = '/schools/EMUC-logo-horizontal-color.svg' 
WHERE name = 'Emory University';

-- Kelley Executive Education Programs
UPDATE schools SET logo_url = '/schools/KSB-logo-horizontal-knockout.svg' 
WHERE name = 'Kelley Executive Education Programs';

-- Michigan State University
UPDATE schools SET logo_url = '/schools/MSU Broad Logo Horiz New.svg' 
WHERE name = 'Michigan State University';

-- Nexford University
UPDATE schools SET logo_url = '/schools/Nexford-logo-horizontal-color.svg' 
WHERE name = 'Nexford University';

-- Southern Methodist University
UPDATE schools SET logo_url = '/schools/SMU-logo-horizontal-color-1.svg' 
WHERE name = 'Southern Methodist University';

-- St. Catherine University
UPDATE schools SET logo_url = '/schools/St Catherine-logo-horizontal-color.svg' 
WHERE name = 'St. Catherine University';

-- University of South Florida (use the horizontal color version)
UPDATE schools SET logo_url = '/schools/USF-logo-horizontal-color.svg' 
WHERE name = 'University of South Florida';

-- University of Louisville
UPDATE schools SET logo_url = '/schools/University of Louiville.svg' 
WHERE name = 'University of Louisville';

-- Pinellas Technical College (already set)
UPDATE schools SET logo_url = '/schools/ptec.png' 
WHERE name = 'Pinellas Technical College';

-- St. Petersburg College (already set)
UPDATE schools SET logo_url = '/schools/spc.svg' 
WHERE name = 'St. Petersburg College';

-- Add comment
COMMENT ON COLUMN schools.logo_url IS 'Path to school logo file in /public/schools directory';
