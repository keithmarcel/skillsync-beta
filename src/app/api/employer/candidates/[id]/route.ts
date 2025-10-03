import { NextRequest, NextResponse } from 'next/server'
import {
  sendInvitationToCandidate,
  markCandidateAsHired,
  markCandidateAsUnqualified,
  archiveCandidate,
  reopenCandidate,
} from '@/lib/services/employer-invitations'

/**
 * PATCH /api/employer/candidates/[id]
 * Update candidate status (employer actions)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action, message } = await request.json()
    const candidateId = params.id

    switch (action) {
      case 'invite':
        await sendInvitationToCandidate(candidateId, message)
        break
      case 'hire':
        await markCandidateAsHired(candidateId)
        break
      case 'unqualified':
        await markCandidateAsUnqualified(candidateId)
        break
      case 'archive':
        await archiveCandidate(candidateId)
        break
      case 'reopen':
        await reopenCandidate(candidateId)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error updating candidate:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
