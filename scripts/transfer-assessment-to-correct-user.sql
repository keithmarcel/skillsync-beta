-- Transfer the assessment with skills to the correct user
UPDATE assessments
SET user_id = '72b464ef-1814-4942-b69e-2bdffd390e61'
WHERE id = '888339eb-e9b5-43da-9cc3-403860e04cac';

-- Verify the update
SELECT 
    a.id,
    a.user_id,
    a.method,
    COUNT(asr.skill_id) as skill_count,
    'Assessment now belongs to correct user!' as status
FROM assessments a
LEFT JOIN assessment_skill_results asr ON a.id = asr.assessment_id
WHERE a.id = '888339eb-e9b5-43da-9cc3-403860e04cac'
GROUP BY a.id, a.user_id, a.method;
