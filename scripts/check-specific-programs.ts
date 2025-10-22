import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkPrograms() {
  const programNames = [
    'Graduate Certificate in Healthcare Compliance',
    'Health & Early Childhood Development'
  ]

  for (const name of programNames) {
    console.log(`\n📚 ${name}`)
    
    const { data: program } = await supabase
      .from('programs')
      .select('id, cip_code')
      .eq('name', name)
      .single()

    if (!program) {
      console.log('   ❌ Program not found')
      continue
    }

    console.log(`   CIP: ${program.cip_code}`)

    // Check crosswalk
    const { data: crosswalk } = await supabase
      .from('cip_soc_crosswalk')
      .select('soc_code')
      .eq('cip_code', program.cip_code)

    console.log(`   Crosswalk entries: ${crosswalk?.length || 0}`)
    
    if (crosswalk && crosswalk.length > 0) {
      const socCodes = crosswalk.map(c => c.soc_code)
      console.log(`   SOC codes: ${socCodes.join(', ')}`)

      // Check jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('title, status')
        .in('soc_code', socCodes)

      console.log(`   Jobs found: ${jobs?.length || 0}`)
      if (jobs && jobs.length > 0) {
        jobs.forEach(j => console.log(`     - ${j.title} (${j.status})`))
      }
    }
  }
}

checkPrograms().then(() => process.exit(0))
