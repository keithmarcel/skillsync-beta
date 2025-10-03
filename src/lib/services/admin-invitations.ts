import { supabase } from '@/lib/supabase/client'
import { randomBytes } from 'crypto'

export interface AdminInvitation {
  id: string
  email: string
  role: 'provider_admin' | 'employer_admin'
  company_id?: string
  school_id?: string
  invited_by: string
  invited_at: string
  accepted_at?: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  token: string
  max_programs?: number
  max_featured_programs?: number
  max_featured_roles?: number
  created_at: string
  updated_at: string
}

export interface InvitationRequest {
  email: string
  role: 'provider_admin' | 'employer_admin'
  company_id?: string
  school_id?: string
  max_programs?: number
  max_featured_programs?: number
  max_featured_roles?: number
}

export interface InvitationAcceptance {
  token: string
  password: string
  first_name: string
  last_name: string
}

/**
 * Generate a secure random token for invitation
 */
function generateInvitationToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Send invitation to provider or employer admin
 */
export async function sendAdminInvitation(request: InvitationRequest): Promise<{
  invitation: AdminInvitation
  invitation_url: string
}> {
  // Verify requester is super admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    throw new Error('Only super admins can send invitations')
  }

  // Validate email not already registered
  const { data: existingUser } = await supabase
    .from('auth.users')
    .select('email')
    .eq('email', request.email)
    .single()

  if (existingUser) {
    throw new Error('User with this email already exists')
  }

  // Validate company_id or school_id exists based on role
  if (request.role === 'employer_admin' && !request.company_id) {
    throw new Error('Company ID required for employer admin invitations')
  }

  if (request.role === 'provider_admin' && !request.school_id) {
    throw new Error('School ID required for provider admin invitations')
  }

  // Validate company/school exists
  if (request.company_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', request.company_id)
      .single()

    if (!company) {
      throw new Error('Company not found')
    }
  }

  if (request.school_id) {
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('id', request.school_id)
      .single()

    if (!school) {
      throw new Error('School not found')
    }
  }

  // Generate token and create invitation
  const token = generateInvitationToken()

  const invitationData = {
    email: request.email,
    role: request.role,
    company_id: request.company_id,
    school_id: request.school_id,
    invited_by: user.id,
    token,
    max_programs: request.max_programs || (request.role === 'provider_admin' ? 300 : undefined),
    max_featured_programs: request.max_featured_programs || (request.role === 'provider_admin' ? 50 : undefined),
    max_featured_roles: request.max_featured_roles || (request.role === 'employer_admin' ? 10 : undefined),
  }

  const { data: invitation, error } = await supabase
    .from('admin_invitations')
    .insert(invitationData)
    .select()
    .single()

  if (error) throw error

  // Generate invitation URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const invitation_url = `${baseUrl}/auth/accept-invitation?token=${token}`

  // TODO: Send email with invitation (implement later)

  return {
    invitation: invitation as AdminInvitation,
    invitation_url
  }
}

/**
 * Check invitation status by token
 */
export async function checkInvitationStatus(token: string): Promise<{
  valid: boolean
  invitation?: {
    email: string
    role: string
    company_name?: string
    school_name?: string
    expires_at: string
  }
}> {
  const { data: invitation, error } = await supabase
    .from('admin_invitations')
    .select(`
      email,
      role,
      expires_at,
      status,
      companies:company_id (name),
      schools:school_id (name)
    `)
    .eq('token', token)
    .single()

  if (error || !invitation) {
    return { valid: false }
  }

  // Check if invitation is still valid
  const now = new Date()
  const expiresAt = new Date(invitation.expires_at)

  if (invitation.status !== 'pending' || now > expiresAt) {
    return { valid: false }
  }

  return {
    valid: true,
    invitation: {
      email: invitation.email,
      role: invitation.role,
      company_name: invitation.companies?.name,
      school_name: invitation.schools?.name,
      expires_at: invitation.expires_at,
    }
  }
}

/**
 * Accept admin invitation and create account
 */
export async function acceptAdminInvitation(acceptance: InvitationAcceptance): Promise<{
  user: any
  profile: any
  session: any
}> {
  // Validate invitation
  const status = await checkInvitationStatus(acceptance.token)
  if (!status.valid || !status.invitation) {
    throw new Error('Invalid or expired invitation')
  }

  const invitation = status.invitation

  // Create auth account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: invitation.email,
    password: acceptance.password,
    options: {
      data: {
        first_name: acceptance.first_name,
        last_name: acceptance.last_name,
      }
    }
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('Failed to create user account')

  // Get invitation details for profile creation
  const { data: fullInvitation } = await supabase
    .from('admin_invitations')
    .select('*')
    .eq('token', acceptance.token)
    .single()

  if (!fullInvitation) throw new Error('Invitation not found')

  // Create profile with admin role
  const profileData = {
    id: authData.user.id,
    email: invitation.email,
    role: invitation.role,
    first_name: acceptance.first_name,
    last_name: acceptance.last_name,
    company_id: fullInvitation.company_id,
    school_id: fullInvitation.school_id,
    max_programs: fullInvitation.max_programs,
    max_featured_programs: fullInvitation.max_featured_programs,
    max_featured_roles: fullInvitation.max_featured_roles,
    agreed_to_terms: true,
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single()

  if (profileError) throw profileError

  // Mark invitation as accepted
  await supabase
    .from('admin_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('token', acceptance.token)

  // Sign in the user
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password: acceptance.password,
  })

  if (signInError) throw signInError

  return {
    user: authData.user,
    profile,
    session,
  }
}

/**
 * Get all invitations for super admin
 */
export async function getAdminInvitations(): Promise<AdminInvitation[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    throw new Error('Only super admins can view invitations')
  }

  const { data, error } = await supabase
    .from('admin_invitations')
    .select(`
      *,
      companies:company_id (name),
      schools:school_id (name),
      profiles:invited_by (first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AdminInvitation[]
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    throw new Error('Only super admins can cancel invitations')
  }

  const { error } = await supabase
    .from('admin_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)

  if (error) throw error
}
