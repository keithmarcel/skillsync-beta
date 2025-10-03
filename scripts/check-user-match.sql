-- Check if the assessment with skills belongs to the logged-in user
SELECT 
    a.id,
    a.user_id,
    a.method,
    a.analyzed_at,
    COUNT(asr.skill_id) as skill_count,
    CASE 
        WHEN a.user_id = '72b464ef-1814-4942-b69e-2bdffd390e61' THEN 'MATCHES LOGGED IN USER'
        ELSE 'DIFFERENT USER'
    END as user_match
FROM assessments a
LEFT JOIN assessment_skill_results asr ON a.id = asr.assessment_id
WHERE a.id = '888339eb-e9b5-43da-9cc3-403860e04cac'  -- The assessment with 16 skills
GROUP BY a.id, a.user_id, a.method, a.analyzed_at;
