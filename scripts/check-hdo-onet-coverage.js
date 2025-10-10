/**
 * Check O*NET data coverage for HDO occupations
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  const { data: occupations, error } = await supabase
    .from('jobs')
    .select('id, title, soc_code, core_responsibilities, tasks, tools_and_technology')
    .eq('job_kind', 'occupation')
    .eq('status', 'published')

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('📊 HDO O*NET Data Coverage\n')
  console.log(`Total Occupations: ${occupations.length}\n`)

  const withResponsibilities = occupations.filter(j => j.core_responsibilities?.length > 0)
  const withTasks = occupations.filter(j => j.tasks?.length > 0)
  const withTools = occupations.filter(j => j.tools_and_technology?.length > 0)

  console.log(`✅ Core Responsibilities: ${withResponsibilities.length}/${occupations.length} (${Math.round(withResponsibilities.length/occupations.length*100)}%)`)
  console.log(`✅ Tasks: ${withTasks.length}/${occupations.length} (${Math.round(withTasks.length/occupations.length*100)}%)`)
  console.log(`❌ Tools & Technology: ${withTools.length}/${occupations.length} (${Math.round(withTools.length/occupations.length*100)}%)`)

  console.log('\n━'.repeat(40))
  console.log('\n💡 Solution: Run AI enrichment on HDO occupations')
  console.log('   Same script that worked for featured roles can populate tools data')
  
  process.exit(0)
}

main()
