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

    // NEW APPROACH: Use CIP-SOC crosswalk
    const { data: cipMatches } = await supabase
      .from('cip_soc_crosswalk')
      .select('soc_code, match_strength')
      .eq('cip_code', program.cip_code)

    console.log(`   CIP-SOC crosswalk matches: ${cipMatches?.length || 0}`)
    
    if (cipMatches && cipMatches.length > 0) {
      console.log(`   Sample SOC codes: ${cipMatches.slice(0, 3).map(m => m.soc_code).join(', ')}`)
      
      const socCodes = cipMatches.map(m => m.soc_code)
      
      // Get jobs with those SOC codes
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, soc_code, job_kind, status')
        .in('soc_code', socCodes)
        .eq('status', 'published')

      console.log(`   ✅ Jobs with matching SOC codes: ${jobs?.length || 0}`)
      if (jobs && jobs.length > 0) {
        console.log(`   Sample jobs: ${jobs.slice(0, 3).map(j => j.title).join(', ')}`)
      }
    } else {
      console.log(`   ⚠️  No CIP-SOC crosswalk entries for CIP ${program.cip_code}`)
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
