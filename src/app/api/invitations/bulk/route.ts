import { NextRequest, NextResponse } from 'next/server'
import { bulkArchiveInvitations } from '@/lib/services/employer-invitations'

/**
 * POST /api/invitations/bulk
 * Bulk actions on invitations
 */
export async function POST(request: NextRequest) {
  try {
    const { action, invitationIds } = await request.json()

    if (!Array.isArray(invitationIds) || invitationIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invitation IDs' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'archive':
        await bulkArchiveInvitations(invitationIds)
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
