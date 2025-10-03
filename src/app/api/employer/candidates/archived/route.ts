import { NextRequest, NextResponse } from 'next/server'
import { getEmployerArchivedCandidates } from '@/lib/services/employer-invitations'

/**
 * GET /api/employer/candidates/archived
 * Get archived candidates for employer
 */
export async function GET(request: NextRequest) {
  try {
    const candidates = await getEmployerArchivedCandidates()
    return NextResponse.json({ candidates }, { status: 200 })
  } catch (error) {
    console.error('Error fetching archived candidates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
