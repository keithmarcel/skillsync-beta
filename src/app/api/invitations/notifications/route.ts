import { NextRequest, NextResponse } from 'next/server'
import {
  getUnreadInvitationCount,
  getRecentInvitations,
  markAllInvitationsAsRead,
} from '@/lib/services/employer-invitations'

/**
 * GET /api/invitations/notifications
 * Get recent invitations for notification dropdown
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '12')

    const [unreadCount, recentInvitations] = await Promise.all([
      getUnreadInvitationCount(),
      getRecentInvitations(limit),
    ])

    return NextResponse.json(
      {
        unreadCount,
        invitations: recentInvitations,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/invitations/notifications/mark-read
 * Mark all invitations as read
 */
export async function POST(request: NextRequest) {
  try {
    await markAllInvitationsAsRead()
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error marking invitations as read:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
