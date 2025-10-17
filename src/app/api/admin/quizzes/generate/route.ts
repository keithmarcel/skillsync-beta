import { NextRequest, NextResponse } from 'next/server'
import { generateSkillQuestions } from '@/lib/services/quiz-generation'

export async function POST(request: NextRequest) {
  try {
    const { skillId, skillName, proficiencyLevel, questionCount, sectionId, socCode, companyId } = await request.json()

    console.log('🎯 API Route called with:', { skillId, skillName, proficiencyLevel, questionCount, sectionId, socCode, companyId })

    if (!skillId || !skillName || !proficiencyLevel || !questionCount || !sectionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: skillId, skillName, proficiencyLevel, questionCount, sectionId'
      }, { status: 400 })
    }

    console.log('🚀 Calling generateSkillQuestions with context:', { socCode, companyId })

    // Generate questions using the server-side service with full context
    const questions = await generateSkillQuestions({
      socCode: socCode || '', // Pass SOC code for O*NET/job context
      skillId,
      skillName,
      proficiencyLevel,
      questionCount,
      companyId, // Pass company ID for company-specific context
      sessionId: `api-generate-${Date.now()}`
    })

    console.log('📝 Generated questions result:', { 
      count: questions.length,
      sample: questions[0] ? {
        stem: questions[0].stem?.substring(0, 50),
        choices: questions[0].choices,
        correct_answer: questions[0].correct_answer,
        difficulty: questions[0].difficulty
      } : 'No questions generated'
    })

    if (questions.length === 0) {
      console.warn('⚠️ No questions were generated - possible deduplication issue or AI generation failure')
    }

    return NextResponse.json({
      success: true,
      questions
    })

  } catch (error) {
    console.error('❌ Quiz generation API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}