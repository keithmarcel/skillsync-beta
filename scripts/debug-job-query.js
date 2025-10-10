#!/usr/bin/env node
/**
 * Debug job query to see what data is actually being fetched
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugJobQuery(jobId) {
  console.log(`🔍 Debugging job query for ID: ${jobId}\n`)
  
  // Get the job
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      company:companies(id, name, logo_url),
      skills:job_skills(
        skill:skills(id, name, category)
      ),
      bls_employment_projections(*)
    `)
    .eq('id', jobId)
    .single()
  
  if (error) {
    console.error('❌ Error fetching job:', error)
    return
  }
  
  console.log('📊 Job Data:')
  console.log('  Title:', job.title)
  console.log('  SOC Code:', job.soc_code)
  console.log('  Job Kind:', job.job_kind)
  console.log('  Status:', job.status)
  console.log('  Education Level:', job.education_level)
  console.log('  Employment Outlook:', job.employment_outlook)
  console.log('  Median Wage USD:', job.median_wage_usd)
  
  // Check for wage data
  if (job.soc_code) {
    console.log('\n🔍 Checking BLS wage data for SOC:', job.soc_code)
    
    const { data: wageData, error: wageError } = await supabase
      .from('bls_wage_data')
      .select('*')
      .eq('soc_code', job.soc_code)
      .in('area_code', ['45300', '12', '0000000'])
    
    if (wageError) {
      console.error('  ❌ Error fetching wage data:', wageError)
    } else if (!wageData || wageData.length === 0) {
      console.log('  ⚠️  No wage data found for this SOC code')
      console.log('  💡 SOC code in DB might have .00 suffix')
      
      // Try with .00 suffix
      const socWithSuffix = job.soc_code.includes('.') ? job.soc_code : `${job.soc_code}.00`
      const socWithoutSuffix = job.soc_code.replace('.00', '')
      
      console.log(`\n  🔄 Trying alternate formats:`)
      console.log(`     - With suffix: ${socWithSuffix}`)
      console.log(`     - Without suffix: ${socWithoutSuffix}`)
      
      const { data: altData } = await supabase
        .from('bls_wage_data')
        .select('*')
        .in('soc_code', [socWithSuffix, socWithoutSuffix])
      
      if (altData && altData.length > 0) {
        console.log(`  ✅ Found ${altData.length} records with alternate format!`)
        altData.forEach(d => {
          console.log(`     ${d.area_name}: $${d.median_wage} (${d.employment_level} workers)`)
        })
      } else {
        console.log('  ❌ No data found with alternate formats either')
      }
    } else {
      console.log(`  ✅ Found ${wageData.length} wage records:`)
      wageData.forEach(d => {
        console.log(`     ${d.area_name}: $${d.median_wage} (${d.employment_level} workers)`)
      })
    }
  }
  
  console.log('\n📋 BLS Employment Projections:')
  if (job.bls_employment_projections && job.bls_employment_projections.length > 0) {
    const proj = job.bls_employment_projections[0]
    console.log('  Employment 2022:', proj.employment_2022)
    console.log('  Employment 2032:', proj.employment_2032)
    console.log('  Outlook:', proj.outlook_category)
  } else {
    console.log('  ⚠️  No employment projections found')
  }
  
  console.log('\n')
}

// Get job ID from command line or use default
const jobId = process.argv[2] || '9ee597fb-5b50-49bc-9e08-f2543a8b658b'
debugJobQuery(jobId).catch(console.error)
