import { NextRequest, NextResponse } from 'next/server'
import { getUserArchivedInvitations } from '@/lib/services/employer-invitations'

/**
 * GET /api/invitations/archived
 * Get archived invitations for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const invitations = await getUserArchivedInvitations()
    return NextResponse.json({ invitations }, { status: 200 })
  } catch (error) {
    console.error('Error fetching archived invitations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
