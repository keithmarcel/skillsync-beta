import { NextRequest, NextResponse } from 'next/server'
import { getUserInvitations } from '@/lib/services/employer-invitations'

/**
 * GET /api/invitations
 * Get all invitations for the current user (candidate)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters = {
      status: searchParams.get('status') || undefined,
      readiness: searchParams.get('readiness') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const invitations = await getUserInvitations(filters)

    return NextResponse.json({ invitations }, { status: 200 })
  } catch (error) {
    console.error('Error fetching user invitations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
