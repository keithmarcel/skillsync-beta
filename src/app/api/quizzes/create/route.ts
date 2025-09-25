// Quiz creation and management API routes
import { NextRequest, NextResponse } from 'next/server'
import { createSocQuiz } from '@/lib/services/quiz-generation'
import { getQuizBySocCode, getQuizById } from '@/lib/database/queries'

// POST /api/quizzes/create - Create a new SOC-based quiz
export async function POST(request: NextRequest) {
  try {
    const { socCode, companyId } = await request.json()

    if (!socCode) {
      return NextResponse.json(
        { error: 'SOC code is required' },
        { status: 400 }
      )
    }

    // Generate quiz using AI
    const quizId = await createSocQuiz(socCode, companyId)

    return NextResponse.json({
      success: true,
      quizId,
      message: 'Quiz created successfully'
    })

  } catch (error) {
    console.error('Failed to create quiz:', error)
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    )
  }
}
