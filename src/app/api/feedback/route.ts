import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { sentiment, message, user_id, user_email } = body

    console.log('📝 Feedback submission:', { sentiment, message, user_id, user_email })

    // Insert feedback into database
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        sentiment,
        message,
        user_id,
        user_email
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    console.log('✅ Feedback saved:', data)

    return NextResponse.json({ success: true, feedback: data }, { status: 200 })
  } catch (error) {
    console.error('❌ Error saving feedback:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
