/**
 * LAiSER Program Skills Extraction API Route
 * Extract skills from specific programs using LAiSER
 */

import { NextRequest, NextResponse } from 'next/server'
import LaiserProgramSkillsService from '@/lib/services/laiser-program-skills'

const programService = new LaiserProgramSkillsService()

/**
 * POST /api/admin/laiser/extract-program-skills
 * Extract skills from a specific program
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { programId } = body

    if (!programId || typeof programId !== 'string') {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      )
    }

    const result = await programService.extractProgramSkills(programId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Program skills extraction error:', error)
    return NextResponse.json(
      {
        program_id: '',
        skills_extracted: 0,
        skills_mapped: 0,
        processing_time: 0,
        confidence_score: 0,
        extraction_sources: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
