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
    const { first_name, last_name, linkedin_url, bio, visible_to_employers, avatar_url } = body

    const updateData: any = {
      first_name,
      last_name,
      linkedin_url,
      bio,
      visible_to_employers,
      updated_at: new Date().toISOString()
    }

    // Only include avatar_url if it was provided
    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ profile: data }, { status: 200 })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
