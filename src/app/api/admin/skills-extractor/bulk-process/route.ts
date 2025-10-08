/**
 * LAiSER Bulk Processing API Route
 * Process multiple programs in batch
 */

import { NextRequest, NextResponse } from 'next/server'
import LaiserProgramSkillsService from '@/lib/services/laiser-program-skills'
import { supabase } from '@/lib/supabase/client'

const programService = new LaiserProgramSkillsService()

/**
 * POST /api/admin/laiser/bulk-process
 * Process multiple programs in batch
 */
export async function POST(request: NextRequest) {
  try {
    // Get all programs without skills (limit to prevent overload)
    const { data: programs, error } = await supabase
      .from('programs')
      .select('id, name')
      .limit(10) // Start with small batch

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch programs' },
        { status: 500 }
      )
    }

    if (!programs?.length) {
      return NextResponse.json(
        { error: 'No programs found to process' },
        { status: 404 }
      )
    }

    const results = await programService.batchExtractProgramSkills(
      programs.map(p => p.id)
    )

    const response = {
      bulkResults: results,
      processed: programs.length,
      successful: results.filter(r => r.skills_mapped > 0).length,
      programs: programs.map(p => ({ id: p.id, name: p.name }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Bulk processing error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        processed: 0,
        successful: 0
      },
      { status: 500 }
    )
  }
}
