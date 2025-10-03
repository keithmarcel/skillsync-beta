import { NextRequest, NextResponse } from 'next/server'
import { getEmployerCandidates } from '@/lib/services/employer-invitations'

/**
 * GET /api/employer/candidates
 * Get all candidates for employer's company
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters = {
      role: searchParams.get('role') || undefined,
      readiness: searchParams.get('readiness') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const candidates = await getEmployerCandidates(filters)

    return NextResponse.json({ candidates }, { status: 200 })
  } catch (error) {
    console.error('Error fetching employer candidates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
