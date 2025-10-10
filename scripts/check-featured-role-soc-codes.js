/**
 * Check SOC codes on Featured Roles
 * Quick utility to see current state of SOC code assignments
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('📊 Featured Roles SOC Code Status\n')
  
  const { data: roles, error } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      soc_code,
      status,
      companies (
        name
      )
    `)
    .eq('job_kind', 'featured_role')
    .order('title')

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  console.log(`Total Featured Roles: ${roles.length}\n`)
  console.log('━'.repeat(100))
  
  const withSOC = roles.filter(r => r.soc_code)
  const withoutSOC = roles.filter(r => !r.soc_code)
  
  console.log(`\n✅ WITH SOC CODES (${withSOC.length}):`)
  console.log('━'.repeat(100))
  withSOC.forEach(role => {
    const company = role.companies?.name || 'No Company'
    console.log(`${role.soc_code.padEnd(12)} | ${role.title.padEnd(50)} | ${company}`)
  })
  
  if (withoutSOC.length > 0) {
    console.log(`\n❌ WITHOUT SOC CODES (${withoutSOC.length}):`)
    console.log('━'.repeat(100))
    withoutSOC.forEach(role => {
      const company = role.companies?.name || 'No Company'
      console.log(`${'N/A'.padEnd(12)} | ${role.title.padEnd(50)} | ${company}`)
    })
  }
  
  console.log('\n━'.repeat(100))
  console.log(`\nSummary: ${withSOC.length}/${roles.length} roles have SOC codes (${Math.round(withSOC.length/roles.length*100)}%)`)
  console.log('')
  
  process.exit(0)
}

main()
