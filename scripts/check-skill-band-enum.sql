-- Check what values are actually in the skill_band enum
SELECT 
    enumlabel as skill_band_value,
    enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'skill_band'
)
ORDER BY enumsortorder;
