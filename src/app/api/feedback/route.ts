import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Map emoji sentiment to numeric feedback level (1-5 scale)
const sentimentToLevel = {
  'negative': 1,  // 😟
  'neutral': 3,   // 😐
  'positive': 5   // 😍
} as const

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
    const { sentiment, message, user_id, user_email, route_path } = body

    // Map sentiment to feedback level
    const feedback_level = sentimentToLevel[sentiment as keyof typeof sentimentToLevel]

    console.log('📝 Feedback submission:', { 
      sentiment, 
      feedback_level,
      message, 
      user_id, 
      user_email,
      route_path 
    })

    // Insert feedback into database
    // Try with new fields first, fallback to old schema if migration not applied
    let insertData: any = {
      sentiment,
      message,
      user_id,
      user_email,
    }

    // Add new fields if they exist (after migration)
    if (feedback_level !== undefined) {
      insertData.feedback_level = feedback_level
    }
    if (route_path !== undefined) {
      insertData.route_path = route_path
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      
      // If error is about missing columns, try without new fields
      if (error.message?.includes('column') && (error.message?.includes('feedback_level') || error.message?.includes('route_path'))) {
        console.log('⚠️ New columns not found, trying legacy insert...')
        const { data: legacyData, error: legacyError } = await supabase
          .from('feedback')
          .insert({
            sentiment,
            message,
            user_id,
            user_email,
          })
          .select()
          .single()
        
        if (legacyError) {
          throw legacyError
        }
        
        console.log('✅ Feedback saved (legacy mode):', legacyData)
        return NextResponse.json({ 
          success: true, 
          feedback: legacyData,
          warning: 'Migration not applied - route_path and feedback_level not saved'
        }, { status: 200 })
      }
      
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
