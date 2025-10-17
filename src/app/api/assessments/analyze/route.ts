import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  calculateWeightedScore, 
  calculateRoleReadiness 
} from '@/lib/services/assessment-engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const { assessmentId } = await request.json();

    if (!assessmentId) {
      return NextResponse.json(
        { success: false, error: 'Assessment ID is required' },
        { status: 400 }
      );
    }

    // 1. Get assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*, job:jobs(*)')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // 3. Get quiz responses with question details (including importance for weighting)
    const { data: responses, error: responsesError } = await supabase
      .from('quiz_responses')
      .select(`
        *,
        question:quiz_questions(
          id,
          stem,
          answer_key,
          difficulty,
          importance,
          section_id,
          section:quiz_sections(
            skill_id
          )
        )
      `)
      .eq('assessment_id', assessmentId);

    if (responsesError || !responses || responses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No quiz responses found' },
      );
    }

    // 3. Get quiz ID and details from job
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id, job_id, soc_code, company_id')
      .eq('job_id', assessment.job_id)
      .single();

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found for this job' },
        { status: 404 }
      );
    }

    // 4. Get skill weightings for this quiz/job
    const { data: skillWeightings } = await supabase
      .from('skill_weightings')
      .select('*')
      .eq('quiz_id', quiz.id);

    // 5. Transform responses for assessment engine with full context
    console.log('Sample response structure:', JSON.stringify(responses[0], null, 2));
    
    const userResponses = responses.map((r: any) => ({
      questionId: r.question_id,
      skillId: r.question?.section?.skill_id || '',
      userAnswer: r.selected || '',
      correctAnswer: r.question?.answer_key || '',
      isCorrect: r.is_correct || false,
      timeSpent: 30, // Default, could track actual time
      difficulty: r.question?.difficulty || 'medium',
      questionImportance: r.question?.importance || 3.0, // NEW: Question-level importance for weighting
      questionStem: r.question?.stem || ''
    }));

    const uniqueSkills = new Set(userResponses.map(r => r.skillId));
    console.log('Unique skills found:', Array.from(uniqueSkills));
    console.log('Responses per skill:', userResponses.reduce((acc: any, r) => {
      acc[r.skillId || 'unknown'] = (acc[r.skillId || 'unknown'] || 0) + 1;
      return acc;
    }, {}));

    // 6. Calculate weighted scores using assessment engine
    console.log('🎯 Starting weighted score calculation...');
    console.log(`  - Assessment ID: ${assessmentId}`);
    console.log(`  - Quiz ID: ${quiz.id}`);
    console.log(`  - SOC Code: ${quiz.soc_code}`);
    console.log(`  - Total Responses: ${userResponses.length}`);
    console.log(`  - Skill Weightings Available: ${skillWeightings?.length || 0}`);

    const skillScores = await calculateWeightedScore(
      userResponses,
      quiz.id,
      quiz.company_id
    );

    console.log('✅ Weighted scores calculated:');
    skillScores.forEach((score) => {
      console.log(`  - Skill ${score.skillId}: Raw=${score.rawScore.toFixed(1)}%, Weighted=${score.weightedScore.toFixed(1)}%`);
      console.log(`    AI Quality: ${score.aiEvaluation.overallQuality.toFixed(1)}%`);
    });

    // 7. Calculate role readiness with full context
    console.log('🎯 Calculating role readiness...');
    const roleReadiness = await calculateRoleReadiness(
      assessment.user_id,
      assessment.job_id, // Using job_id as role_id
      skillScores
    );

    console.log('✅ Role readiness calculated:');
    console.log(`  - Overall Proficiency: ${roleReadiness.overallProficiency.toFixed(1)}%`);
    console.log(`  - Role Readiness: ${roleReadiness.roleReadiness}`);
    console.log(`  - Strength Areas: ${roleReadiness.strengthAreas.length}`);
    console.log(`  - Development Areas: ${roleReadiness.developmentAreas.length}`);
    console.log(`  - Critical Gaps: ${roleReadiness.criticalGaps.length}`);

    // 7. Save skill results to database
    // Get custom proficiency thresholds for featured roles
    const { data: jobSkills } = await supabase
      .from('job_skills')
      .select('skill_id, proficiency_threshold')
      .eq('job_id', assessment.job_id);
    
    const thresholdMap = new Map(
      jobSkills?.map(js => [js.skill_id, js.proficiency_threshold]) || []
    );
    
    const skillResults = skillScores.map((score) => ({
      assessment_id: assessmentId,
      skill_id: score.skillId,
      score_pct: score.weightedScore, // Use weighted score for question-level importance
      band: getBand(score.weightedScore, thresholdMap.get(score.skillId))
    }));

    console.log('Attempting to save skill results:', skillResults.length);
    console.log('Sample skill result:', skillResults[0]);
    
    const { data: insertedData, error: skillResultsError } = await supabase
      .from('assessment_skill_results')
      .upsert(skillResults, { onConflict: 'assessment_id,skill_id' })
      .select();

    if (skillResultsError) {
      console.error('❌ Error saving skill results:', skillResultsError);
      return NextResponse.json(
        { success: false, error: 'Failed to save skill results', details: skillResultsError },
        { status: 500 }
      );
    }
    
    console.log('✅ Successfully saved', insertedData?.length, 'skill results');

    // 8. Update assessment with final results
    const statusTag = getStatusTag(roleReadiness.overallProficiency);

    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        readiness_pct: roleReadiness.overallProficiency,
        status_tag: statusTag,
        analyzed_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('Error updating assessment:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update assessment' },
        { status: 500 }
      );
    }

    // 9. Auto-Invite Trigger: Create invite if proficiency meets threshold
    const visibilityThreshold = assessment.job?.visibility_threshold_pct || 85;
    
    if (roleReadiness.overallProficiency >= visibilityThreshold) {
      console.log(`🎯 Proficiency ${roleReadiness.overallProficiency}% meets threshold ${visibilityThreshold}% - creating auto-invite...`);
      
      // Check if invite already exists for this assessment
      const { data: existingInvite } = await supabase
        .from('employer_invitations')
        .select('id')
        .eq('assessment_id', assessmentId)
        .single();
      
      if (!existingInvite && assessment.job?.company_id && assessment.job?.application_url) {
        const { error: inviteError } = await supabase
          .from('employer_invitations')
          .insert({
            user_id: assessment.user_id,
            company_id: assessment.job.company_id,
            job_id: assessment.job_id,
            assessment_id: assessmentId,
            proficiency_pct: roleReadiness.overallProficiency,
            application_url: assessment.job.application_url,
            status: 'sent',
            invited_at: new Date().toISOString()
          });
        
        if (inviteError) {
          console.error('⚠️ Failed to create auto-invite:', inviteError);
          // Don't fail the whole request - just log the error
        } else {
          console.log('✅ Auto-invite created successfully');
        }
      } else if (existingInvite) {
        console.log('ℹ️ Invite already exists for this assessment');
      } else {
        console.log('⚠️ Missing company_id or application_url - cannot create invite');
      }
    } else {
      console.log(`ℹ️ Proficiency ${roleReadiness.overallProficiency}% below threshold ${visibilityThreshold}% - no invite created`);
    }

    // 10. Return success with results
    const response = {
      success: true,
      readiness_pct: roleReadiness.overallProficiency,
      status_tag: statusTag,
      role_readiness: roleReadiness.roleReadiness,
      skill_results: skillResults,
      analyzed_at: new Date().toISOString(),
      summary: {
        overall_proficiency: roleReadiness.overallProficiency,
        strength_areas: roleReadiness.strengthAreas || [],
        development_areas: roleReadiness.developmentAreas || [],
        critical_gaps: roleReadiness.criticalGaps || [],
        next_steps: roleReadiness.nextSteps || []
      }
    };
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Assessment analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to analyze assessment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function getBand(score: number, customThreshold?: number): 'building' | 'proficient' | 'needs_dev' {
  // Use custom threshold for featured roles, or default thresholds for high-demand occupations
  const proficientThreshold = customThreshold || 80;
  const buildingThreshold = customThreshold ? customThreshold - 20 : 60;
  
  if (score >= proficientThreshold) return 'proficient';
  if (score >= buildingThreshold) return 'building';
  return 'needs_dev';
}

function getStatusTag(proficiency: number): 'role_ready' | 'close_gaps' | 'needs_development' {
  if (proficiency >= 80) return 'role_ready';
  if (proficiency >= 60) return 'close_gaps';
  return 'needs_development';
}
