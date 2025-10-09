import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || 'all'
    const adminRoleFilter = searchParams.get('adminRole') || 'all'

    // Build query
    let query = supabaseAdmin
      .from('profiles')
      .select(`
        *,
        company:companies(id, name),
        school:schools(id, name)
      `)
      .order('created_at', { ascending: false })

    // Apply search filter
    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter)
    }

    // Apply admin role filter
    if (adminRoleFilter !== 'all') {
      if (adminRoleFilter === 'none') {
        query = query.is('admin_role', null)
      } else {
        query = query.eq('admin_role', adminRoleFilter)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: data })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
