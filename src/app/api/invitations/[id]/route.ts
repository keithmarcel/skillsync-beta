import { NextRequest, NextResponse } from 'next/server'
import {
  markInvitationAsViewed,
  markInvitationAsApplied,
  markInvitationAsDeclined,
  archiveInvitation,
  reopenInvitation,
} from '@/lib/services/employer-invitations'

/**
 * PATCH /api/invitations/[id]
 * Update invitation status (candidate actions)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await request.json()
    const invitationId = params.id

    switch (action) {
      case 'view':
        await markInvitationAsViewed(invitationId)
        break
      case 'apply':
        await markInvitationAsApplied(invitationId)
        break
      case 'decline':
        await markInvitationAsDeclined(invitationId)
        break
      case 'archive':
        await archiveInvitation(invitationId)
        break
      case 'reopen':
        await reopenInvitation(invitationId)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error updating invitation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
