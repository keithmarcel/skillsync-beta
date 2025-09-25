// Quiz management API routes
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/quizzes - List all quizzes with filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const socCode = searchParams.get('socCode')
  const status = searchParams.get('status')
  const companyId = searchParams.get('companyId')

  try {
    let query = supabase
      .from('quizzes')
      .select(`
        *,
        company:companies(*),
        sections:quiz_sections(count)
      `)

    if (socCode) {
      query = query.eq('soc_code', socCode)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ quizzes: data })

  } catch (error) {
    console.error('Failed to fetch quizzes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
}
