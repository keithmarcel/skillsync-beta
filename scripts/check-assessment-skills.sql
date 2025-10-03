-- Check if assessment skill results were created
SELECT 
    a.id as assessment_id,
    a.method,
    a.analyzed_at,
    COUNT(asr.skill_id) as skill_count,
    STRING_AGG(asr.band::text, ', ') as bands
FROM assessments a
LEFT JOIN assessment_skill_results asr ON a.id = asr.assessment_id
WHERE a.user_id = (SELECT id FROM auth.users LIMIT 1)
GROUP BY a.id, a.method, a.analyzed_at
ORDER BY a.analyzed_at DESC;
