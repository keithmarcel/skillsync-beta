/**
 * Fix Business Development Manager SOC code
 * Corrects from 11-2021.00 (Marketing Managers) to 11-2022.00 (Sales Managers)
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('🔧 Fixing Business Development Manager SOC code\n')
  
  const { data, error } = await supabase
    .from('jobs')
    .update({ soc_code: '11-2022.00' })
    .eq('title', 'Business Development Manager')
    .eq('job_kind', 'featured_role')
    .select()

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  console.log('✅ Updated:', data)
  console.log('\n📊 Business Development Manager now uses:')
  console.log('   11-2022.00 (Sales Managers) ✓')
  console.log('   Previously: 11-2021.00 (Marketing Managers) ✗')
  console.log('')
  
  process.exit(0)
}

main()
