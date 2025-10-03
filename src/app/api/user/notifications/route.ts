import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const {
      notif_in_app_invites,
      notif_in_app_new_roles,
      notif_email_new_roles,
      notif_email_invites,
      notif_email_marketing,
      notif_email_security,
      notif_all_disabled
    } = body

    const { data, error } = await supabase
      .from('profiles')
      .update({
        notif_in_app_invites,
        notif_in_app_new_roles,
        notif_email_new_roles,
        notif_email_invites,
        notif_email_marketing,
        notif_email_security,
        notif_all_disabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ profile: data }, { status: 200 })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
