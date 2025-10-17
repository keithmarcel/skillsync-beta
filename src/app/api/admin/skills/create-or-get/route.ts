import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/admin/skills/create-or-get
 * Create skills if they don't exist, or return existing skill IDs
 */
export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  try {
    const { skills } = await request.json()

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json(
        { error: 'Skills array is required' },
        { status: 400 }
      )
    }

    const skillIds: string[] = []

    // Process each skill
    for (const skill of skills) {
      const { name, description, category, soc_code, source } = skill

      if (!name) continue

      // Check if skill already exists
      const { data: existing, error: searchError } = await supabase
        .from('skills')
        .select('id')
        .eq('name', name)
        .maybeSingle()

      if (searchError) {
        console.error('Error searching for skill:', searchError)
        continue
      }

      if (existing) {
        // Skill exists, use its ID
        skillIds.push(existing.id)
      } else {
        // Create new skill
        const { data: newSkill, error: createError } = await supabase
          .from('skills')
          .insert({
            name,
            description: description || null,
            category: category || 'General',
            soc_code: soc_code || null,
            source: source || 'AI_EXTRACTED'
          })
          .select('id')
          .single()

        if (createError) {
          console.error('Error creating skill:', createError)
          continue
        }

        if (newSkill) {
          skillIds.push(newSkill.id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      skillIds,
      count: skillIds.length
    })
  } catch (error) {
    console.error('Error in create-or-get skills:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process skills' },
      { status: 500 }
    )
  }
}
