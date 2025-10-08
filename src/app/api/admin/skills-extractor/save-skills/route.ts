/**
 * Save Curated Skills API Route
 * Saves admin-curated skills to the database for a specific SOC code
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { socCode, skills, curatedBy } = body

    if (!socCode || !skills || !Array.isArray(skills)) {
      return NextResponse.json(
        { error: 'SOC code and skills array are required' },
        { status: 400 }
      )
    }

    // Insert skills into database (only using existing columns)
    const skillsToInsert = skills.map((skill: any) => ({
      name: skill.skill,
      description: skill.description || skill.knowledge_required?.join(', ') || null,
      source: skill.source || 'OPENAI',
      category: 'technical' // Default category
    }))

    console.log('Attempting to insert skills:', skillsToInsert)
    
    // Check for existing skills by name to avoid duplicates
    const skillNames = skillsToInsert.map(s => s.name)
    const { data: existingSkills } = await supabase
      .from('skills')
      .select('id, name')
      .in('name', skillNames)
    
    const existingSkillMap = new Map(existingSkills?.map(s => [s.name, s.id]) || [])
    
    // Update existing skills with new descriptions
    for (const skill of skillsToInsert) {
      const existingId = existingSkillMap.get(skill.name)
      if (existingId) {
        await supabase
          .from('skills')
          .update({
            description: skill.description,
            source: skill.source,
            category: skill.category
          })
          .eq('id', existingId)
      }
    }
    
    // Only insert skills that don't already exist
    const newSkills = skillsToInsert.filter(s => !existingSkillMap.has(s.name))
    
    let insertedSkills: any[] = []
    if (newSkills.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('skills')
        .insert(newSkills)
        .select()
      
      if (insertError) {
        console.error('Database error:', insertError)
        return NextResponse.json(
          { 
            error: 'Failed to save skills to database', 
            details: insertError.message,
          },
          { status: 500 }
        )
      }
      insertedSkills = inserted || []
    }
    
    // Combine existing and newly inserted skills
    const allSkills = [
      ...skillsToInsert.map(s => ({
        id: existingSkillMap.get(s.name),
        name: s.name,
        description: s.description,
        source: s.source,
        category: s.category
      })).filter(s => s.id),
      ...insertedSkills
    ]
    
    const data = allSkills

    console.log('Skills saved successfully:', data?.length)

    // Delete existing soc_skills entries for this SOC code (to replace, not append)
    await supabase
      .from('soc_skills')
      .delete()
      .eq('soc_code', socCode)

    // Create SOC code to skills mapping in junction table
    if (data && data.length > 0) {
      const socSkillsToInsert = data.map((skill, index) => ({
        soc_code: socCode,
        skill_id: skill.id,
        display_order: index,
        is_primary: index < 5, // First 5 skills are primary
        weight: skills[index]?.confidence ? skills[index].confidence / 100 : 0.75,
        created_by: curatedBy
      }))

      const { error: junctionError } = await supabase
        .from('soc_skills')
        .upsert(socSkillsToInsert, {
          onConflict: 'soc_code,skill_id',
          ignoreDuplicates: false
        })

      if (junctionError) {
        console.error('Failed to create SOC-skills mapping:', junctionError)
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      skillsSaved: data?.length || 0,
      skills: data
    })

  } catch (error) {
    console.error('Save skills error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
