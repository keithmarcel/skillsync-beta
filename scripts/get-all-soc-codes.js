#!/usr/bin/env node
/**
 * Get all SOC codes from jobs table to import wage data for
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function getAllSOCCodes() {
  console.log('🔍 Getting all SOC codes from jobs table\n')
  
  const { data, error } = await supabase
    .from('jobs')
    .select('soc_code, title, job_kind')
    .not('soc_code', 'is', null)
    .eq('status', 'published')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  // Get unique SOC codes
  const uniqueSOCs = [...new Set(data.map(j => j.soc_code))].sort()
  
  console.log(`Found ${uniqueSOCs.length} unique SOC codes:\n`)
  
  uniqueSOCs.forEach(soc => {
    const jobs = data.filter(j => j.soc_code === soc)
    console.log(`${soc} - ${jobs[0].title} (${jobs.length} job${jobs.length > 1 ? 's' : ''})`)
  })
  
  console.log('\n')
  console.log('Copy these for import script:')
  console.log(JSON.stringify(uniqueSOCs, null, 2))
}

getAllSOCCodes().catch(console.error)
