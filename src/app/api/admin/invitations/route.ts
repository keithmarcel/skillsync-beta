import { NextRequest, NextResponse } from 'next/server'
import { sendAdminInvitation } from '@/lib/services/admin-invitations'
import type { InvitationRequest } from '@/lib/services/admin-invitations'

export async function POST(request: NextRequest) {
  try {
    const body: InvitationRequest = await request.json()

    // Validate required fields
    if (!body.email || !body.role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['provider_admin', 'employer_admin'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be provider_admin or employer_admin' },
        { status: 400 }
      )
    }

    // Validate associations based on role
    if (body.role === 'employer_admin' && !body.company_id) {
      return NextResponse.json(
        { error: 'Company ID is required for employer admin invitations' },
        { status: 400 }
      )
    }

    if (body.role === 'provider_admin' && !body.school_id) {
      return NextResponse.json(
        { error: 'School ID is required for provider admin invitations' },
        { status: 400 }
      )
    }

    const result = await sendAdminInvitation(body)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error sending admin invitation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
