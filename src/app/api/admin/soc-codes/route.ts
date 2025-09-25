// API endpoint to get SOC codes with job counts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    // Get SOC codes with job counts
    const { data, error } = await supabase
      .from('jobs')
      .select('soc_code, title')
      .not('soc_code', 'is', null)
      .order('soc_code')

    if (error) throw error

    // Group by SOC code and count jobs
    const socCodeMap = new Map()
    data?.forEach(job => {
      if (!socCodeMap.has(job.soc_code)) {
        socCodeMap.set(job.soc_code, {
          soc_code: job.soc_code,
          title: job.title,
          job_count: 0,
          skills_count: 0
        })
      }
      socCodeMap.get(job.soc_code).job_count++
    })

    // Get skills count for each SOC code
    const socCodes = Array.from(socCodeMap.values())
    for (const socData of socCodes) {
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select(`
          id,
          job_skills!inner (
            jobs!inner (
              soc_code
            )
          )
        `)
        .eq('job_skills.jobs.soc_code', socData.soc_code)

      if (!skillsError && skillsData) {
        // Count unique skills for this SOC code
        const uniqueSkillIds = new Set(skillsData.map(s => s.id))
        socData.skills_count = uniqueSkillIds.size
      }
    }

    return NextResponse.json({ socCodes })
  } catch (error) {
    console.error('Failed to fetch SOC codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SOC codes' },
      { status: 500 }
    )
  }
}
