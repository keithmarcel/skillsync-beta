/**
 * Verify Program Skills Data Quality
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyProgramSkills() {
  console.log('🔍 Verifying Program Skills Data...\n')

  // Get total counts
  const { count: totalPrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })

  const { count: totalProgramSkills } = await supabase
    .from('program_skills')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 Total programs: ${totalPrograms}`)
  console.log(`📊 Total program_skills entries: ${totalProgramSkills}\n`)

  // Get programs with skills
  const { data: programsWithSkills } = await supabase
    .from('programs')
    .select('id, name, cip_code, skills_count')
    .gt('skills_count', 0)
    .order('skills_count', { ascending: false })
    .limit(10)

  console.log('✅ Top 10 programs with most skills:')
  programsWithSkills?.forEach(p => {
    console.log(`  - ${p.name} (${p.cip_code}): ${p.skills_count} skills`)
  })

  // Get programs without skills
  const { count: programsWithoutSkills } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .or('skills_count.is.null,skills_count.eq.0')

  console.log(`\n⚠️  Programs without skills: ${programsWithoutSkills}`)

  // Sample program_skills entries
  const { data: sampleSkills } = await supabase
    .from('program_skills')
    .select(`
      program_id,
      skill_id,
      weight,
      coverage_level,
      programs!inner(name, cip_code),
      skills!inner(name, source)
    `)
    .limit(5)

  console.log('\n📝 Sample program_skills entries:')
  sampleSkills?.forEach((ps: any) => {
    console.log(`  - ${ps.programs.name}`)
    console.log(`    Skill: ${ps.skills.name} (${ps.skills.source})`)
    console.log(`    Weight: ${ps.weight}, Coverage: ${ps.coverage_level}\n`)
  })

  // Check if skills are properly linked
  const { data: skillCheck } = await supabase
    .from('program_skills')
    .select('skill_id')
    .limit(1)

  if (skillCheck && skillCheck.length > 0) {
    const { data: skillExists } = await supabase
      .from('skills')
      .select('id, name')
      .eq('id', skillCheck[0].skill_id)
      .single()

    if (skillExists) {
      console.log(`✅ Skills are properly linked: "${skillExists.name}"`)
    }
  }
}

verifyProgramSkills()
  .then(() => {
    console.log('\n✅ Verification complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
