import { NextRequest, NextResponse } from 'next/server'
import { bulkArchiveCandidates } from '@/lib/services/employer-invitations'

/**
 * POST /api/employer/candidates/bulk
 * Bulk actions on candidates
 */
export async function POST(request: NextRequest) {
  try {
    const { action, candidateIds } = await request.json()

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid candidate IDs' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'archive':
        await bulkArchiveCandidates(candidateIds)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
