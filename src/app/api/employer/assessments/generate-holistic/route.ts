// Holistic employer assessment generation API
// Uses the same skills extraction pipeline as admin but for role-specific assessments

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSocQuiz } from '@/lib/services/quiz-generation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/employer/assessments/generate-holistic
 * Create a holistic assessment for a specific role using multi-source skills analysis
 */
export async function POST(request: NextRequest) {
  try {
    const { jobId, companyId } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Starting holistic assessment generation for job:', jobId)

    // Step 1: Get job details and validate
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, soc_code, long_desc, job_kind')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Step 2: Verify job has skills before attempting generation
    const { data: jobSkills, error: skillsError } = await supabase
      .from('job_skills')
      .select('skill_id')
      .eq('job_id', jobId)
      .limit(1)

    if (skillsError || !jobSkills || jobSkills.length === 0) {
      return NextResponse.json(
        { error: 'No skills found for this job. Please add skills before generating an assessment.' },
        { status: 400 }
      )
    }

    // Step 3: Generate assessment using existing SOC-based quiz generation
    // This will use the job's SOC code and existing skills extraction pipeline
    const quizId = await createSocQuiz(job.soc_code || 'CUSTOM', companyId)

    // Step 4: Update quiz to be associated with the specific job and mark as custom
    await supabase
      .from('quizzes')
      .update({
        job_id: jobId,
        title: `${job.title} - Skills Assessment`,
        description: `AI-generated assessment for ${job.title} role`,
        is_standard: false, // Mark as custom employer assessment
        status: 'draft' // Start as draft for employer review
      })
      .eq('id', quizId)

    // Step 5: Get assessment details for response
    const { data: quiz } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        description,
        total_questions,
        status
      `)
      .eq('id', quizId)
      .single()

    // Get question count
    const { count: questionCount } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true })
      .eq('section_id', (
        await supabase
          .from('quiz_sections')
          .select('id')
          .eq('quiz_id', quizId)
          .single()
      ).data?.id)

    return NextResponse.json({
      success: true,
      assessment: {
        quizId: quiz?.id,
        title: quiz?.title,
        description: quiz?.description,
        questionCount: questionCount || 0,
        status: quiz?.status,
        skillsAnalyzed: jobSkills.length,
        socCode: job.soc_code,
        jobKind: job.job_kind
      },
      message: `Successfully generated assessment with ${questionCount || 0} questions based on ${jobSkills.length} role skills.`
    })

  } catch (error) {
    console.error('Holistic assessment generation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred during assessment generation' },
      { status: 500 }
    )
  }
}
