/**
 * Debug Program-Job Matching
 * Check why programs show "0 jobs"
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debugMatching() {
  console.log('🔍 Debugging Program-Job Matching...\n')

  // Get a sample program
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, cip_code')
    .limit(3)

  if (!programs || programs.length === 0) {
    console.log('❌ No programs found')
    return
  }

  for (const program of programs) {
    console.log(`\n📚 Program: ${program.name}`)
    console.log(`   CIP: ${program.cip_code}`)

    // Get program skills
    const { data: programSkills } = await supabase
      .from('program_skills')
      .select('skill_id, skills(name)')
      .eq('program_id', program.id)

    console.log(`   Skills: ${programSkills?.length || 0}`)
    if (programSkills && programSkills.length > 0) {
      console.log(`   Sample skills: ${programSkills.slice(0, 3).map((ps: any) => ps.skills.name).join(', ')}`)
    }

    if (!programSkills || programSkills.length === 0) {
      console.log('   ⚠️  No skills found for this program')
      continue
    }

    const skillIds = programSkills.map(ps => ps.skill_id)

    // Check job_skills matches
    const { data: jobSkills } = await supabase
      .from('job_skills')
      .select('job_id, skill_id, jobs(title, job_kind)')
      .in('skill_id', skillIds)

    console.log(`   Matching job_skills entries: ${jobSkills?.length || 0}`)
    
    if (jobSkills && jobSkills.length > 0) {
      const uniqueJobs = new Set(jobSkills.map(js => js.job_id))
      console.log(`   Unique jobs: ${uniqueJobs.size}`)
      console.log(`   Sample jobs: ${jobSkills.slice(0, 3).map((js: any) => js.jobs?.title).join(', ')}`)
    }

    // Check soc_skills matches (for occupations)
    const { data: socSkills } = await supabase
      .from('soc_skills')
      .select('soc_code, skill_id')
      .in('skill_id', skillIds)

    console.log(`   Matching soc_skills entries: ${socSkills?.length || 0}`)

    if (socSkills && socSkills.length > 0) {
      const uniqueSocs = new Set(socSkills.map(ss => ss.soc_code))
      console.log(`   Unique SOC codes: ${uniqueSocs.size}`)

      // Get jobs with those SOC codes
      const { data: socJobs } = await supabase
        .from('jobs')
        .select('id, title, soc_code, job_kind')
        .in('soc_code', Array.from(uniqueSocs))

      console.log(`   Jobs with matching SOC codes: ${socJobs?.length || 0}`)
    }
  }

  // Summary
  console.log('\n📊 Summary:')
  const { count: totalPrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })

  const { count: totalJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })

  const { count: totalJobSkills } = await supabase
    .from('job_skills')
    .select('*', { count: 'exact', head: true })

  const { count: totalSocSkills } = await supabase
    .from('soc_skills')
    .select('*', { count: 'exact', head: true })

  console.log(`Total programs: ${totalPrograms}`)
  console.log(`Total jobs: ${totalJobs}`)
  console.log(`Total job_skills: ${totalJobSkills}`)
  console.log(`Total soc_skills: ${totalSocSkills}`)
}

debugMatching()
  .then(() => {
    console.log('\n✅ Debug complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
