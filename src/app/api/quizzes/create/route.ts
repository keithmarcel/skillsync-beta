// Quiz creation and management API routes
import { NextRequest, NextResponse } from 'next/server'
import { createSocQuiz } from '@/lib/services/quiz-generation'
import { getQuizBySocCode, getQuizById } from '@/lib/database/queries'
import { createClient } from '@supabase/supabase-js'
import { updateProgress } from '@/lib/utils/progress'

// Use server-side Supabase client for API operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// POST /api/quizzes/create - Create a new SOC-based quiz
export async function POST(request: NextRequest) {
  try {
    const { socCode, companyId, sessionId } = await request.json()

    if (!socCode) {
      return NextResponse.json(
        { error: 'SOC code is required' },
        { status: 400 }
      )
    }

    console.log('Creating quiz for SOC code:', socCode, 'company:', companyId)

    // Update progress: Starting validation
    if (sessionId) {
      updateProgress(sessionId, {
        status: 'validating',
        step: 1,
        totalSteps: 5,
        message: 'Validating SOC code and checking for existing skills...'
      })
    }

    // PRE-VALIDATION: Check if SOC code has skills before attempting generation
    // First get the job
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('soc_code', socCode)
      .limit(1)
      .single()

    console.log('Job lookup in API:', { jobData, jobError })

    if (jobError || !jobData) {
      return NextResponse.json(
        { error: `No job found for SOC code ${socCode}. Cannot create quiz without a job.` },
        { status: 400 }
      )
    }

    // Now check for skills
    const { data: jobSkillsData, error: skillsError } = await supabase
      .from('job_skills')
      .select('skill_id')
      .eq('job_id', jobData.id)
      .limit(1)

    console.log('Skills lookup in API:', { 
      count: jobSkillsData?.length || 0, 
      error: skillsError 
    })

    if (skillsError || !jobSkillsData || jobSkillsData.length === 0) {
      if (sessionId) {
        updateProgress(sessionId, {
          status: 'error',
          message: `No skills found forSOC code ${socCode}. Cannot create quiz withoutSOC-specific skills.`
        })
      }
      return NextResponse.json(
        { error: `No skills found forSOC code ${socCode}. Cannot create quiz withoutSOC-specific skills.` },
        { status: 400 }
      )
    }

    // Update progress: Starting AI generation
    if (sessionId) {
      updateProgress(sessionId, {
        status: 'generating',
        step: 2,
        totalSteps: 5,
        message: `Found ${jobSkillsData.length} skills. Starting AI question generation...`
      })
    }

    // Generate the quiz
    const quizId = await createSocQuiz(socCode, companyId, sessionId)

    // Update progress: Completed
    if (sessionId) {
      updateProgress(sessionId, {
        status: 'completed',
        step: 5,
        totalSteps: 5,
        message: 'Quiz generation completed successfully!',
        quizId
      })
    }

    console.log('Quiz created successfully:', quizId)

    return NextResponse.json({
      success: true,
      message: 'Quiz created successfully',
      quizId: quizId
    })

  } catch (error) {
    console.error('Failed to create quiz - Full error:', error)
    
    // Convert error to string properly
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error)
      console.error('Error object:', JSON.stringify(error, null, 2))
    } else {
      errorMessage = String(error)
    }
    
    return NextResponse.json(
      {
        error: 'Failed to create quiz',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
