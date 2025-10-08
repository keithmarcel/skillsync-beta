/**
 * Curated Skills API Route
 * Fetches curated skills for a specific SOC code
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const socCode = searchParams.get('socCode')

    if (!socCode) {
      return NextResponse.json(
        { error: 'SOC code is required' },
        { status: 400 }
      )
    }

    // Fetch curated skills for this SOC code
    const { data: socSkills, error } = await supabase
      .from('soc_skills')
      .select(`
        *,
        skills (
          id,
          name,
          description,
          category,
          source
        )
      `)
      .eq('soc_code', socCode)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch curated skills' },
        { status: 500 }
      )
    }

    // Transform and sort the data
    const curatedSkills = socSkills?.map(item => ({
      id: item.skills.id,
      skill: item.skills.name,
      description: item.skills.description,
      category: item.skills.category,
      source: item.skills.source,
      display_order: item.display_order,
      is_primary: item.is_primary,
      weight: item.weight,
      created_at: item.created_at
    })) || []

    // Sort by weight (descending), then alphabetically by name
    curatedSkills.sort((a, b) => {
      if (b.weight !== a.weight) {
        return b.weight - a.weight // Higher weight first
      }
      return a.skill.localeCompare(b.skill) // Then alphabetically
    })

    return NextResponse.json({
      socCode,
      skills: curatedSkills,
      totalSkills: curatedSkills.length
    })

  } catch (error) {
    console.error('Fetch curated skills error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch curated skills' },
      { status: 500 }
    )
  }
}
