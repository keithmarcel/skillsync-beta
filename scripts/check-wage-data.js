#!/usr/bin/env node
/**
 * Check what wage data exists in database
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 Checking BLS Wage Data in Database\n')
  
  // Get all wage data
  const { data, error } = await supabase
    .from('bls_wage_data')
    .select('*')
    .order('soc_code')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${data.length} wage records\n`)
  
  // Group by SOC code
  const bySoc = {}
  data.forEach(record => {
    if (!bySoc[record.soc_code]) {
      bySoc[record.soc_code] = []
    }
    bySoc[record.soc_code].push(record)
  })
  
  // Display
  Object.keys(bySoc).forEach(soc => {
    console.log(`\n📊 ${soc}`)
    bySoc[soc].forEach(record => {
      console.log(`   ${record.area_name}: $${record.median_wage?.toLocaleString()} (${record.employment_level?.toLocaleString()} workers)`)
    })
  })
  
  console.log('\n')
}

checkData().catch(console.error)
