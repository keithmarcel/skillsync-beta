-- Corrected skills table structure query
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'skills' 
ORDER BY ordinal_position;

-- Current skills data sample  
SELECT id, name, source, created_at 
FROM skills 
WHERE source IS NOT NULL 
LIMIT 10;
