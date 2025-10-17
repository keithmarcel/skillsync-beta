-- First, let's check what columns actually exist in these tables

-- 1. Check companies table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- 2. Check jobs table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;

-- 3. Check employer_invitations table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employer_invitations' 
ORDER BY ordinal_position;

-- 4. Check profiles table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
