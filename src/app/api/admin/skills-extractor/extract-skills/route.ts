/**
 * Skills Extraction API Route
 * Extract skills from custom text using OpenAI
 */

import { NextRequest, NextResponse } from 'next/server'
import { openaiSkillsExtractor } from '@/lib/services/openai-skills-extraction'

/**
 * POST /api/admin/laiser/extract-skills
 * Extract skills from text using OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    // Extract skills using OpenAI
    const result = await openaiSkillsExtractor.extractSkills({
      title: 'Custom Text Analysis',
      description: text,
      tasks: [],
      onetSkills: [],
      cosPrograms: [],
      cosCertifications: [],
      lightcastSkills: []
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Skills extraction error:', error)
    return NextResponse.json(
      {
        skills: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        processing_time: 0
      },
      { status: 500 }
    )
  }
}
