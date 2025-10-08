/**
 * Programs API Route
 * Returns list of programs for admin use
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('id, name, cip_code, school_id, program_type, format, short_desc, long_desc')
      .order('name')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch programs' },
        { status: 500 }
      )
    }

    return NextResponse.json(programs || [])

  } catch (error) {
    console.error('Programs fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    )
  }
}
