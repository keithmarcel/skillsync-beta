// API endpoint to get skills for a specific SOC code
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { socCode: string } }
) {
  try {
    const socCode = params.socCode

    console.log(`Fetching skills for SOC code: ${socCode}`)

    // Get all skills for jobs with this SOC code
    const { data: skills, error } = await supabase
      .from('skills')
      .select(`
        id,
        name,
        category,
        description,
        job_skills!inner (
          job_id,
          jobs!inner (
            soc_code
          )
        )
      `)
      .eq('job_skills.jobs.soc_code', socCode)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch skills' },
        { status: 500 }
      )
    }

    // Remove duplicates and clean up the data structure
    const uniqueSkills = skills?.reduce((acc: any[], skill) => {
      const existing = acc.find(s => s.id === skill.id)
      if (!existing) {
        acc.push({
          id: skill.id,
          name: skill.name,
          category: skill.category,
          description: skill.description
        })
      }
      return acc
    }, []) || []

    console.log(`Found ${uniqueSkills.length} unique skills for SOC ${socCode}`)

    return NextResponse.json({
      success: true,
      skills: uniqueSkills,
      count: uniqueSkills.length
    })

  } catch (error) {
    console.error('Failed to fetch SOC skills:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
