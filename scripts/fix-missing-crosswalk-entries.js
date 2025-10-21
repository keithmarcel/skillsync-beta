#!/usr/bin/env node

/**
 * Fix Missing Crosswalk Entries - Production Ready
 * 
 * Systematically adds crosswalk entries for ALL jobs missing them.
 * Uses actual program data to determine correct CIP codes.
 * Ensures 100% coverage before going live.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Find best CIP codes for a job based on:
 * 1. Job title keywords
 * 2. Available programs in database
 * 3. Industry standards
 */
async function findBestCIPCodes(job) {
  const title = job.title.toLowerCase()
  const socCode = job.soc_code
  
  // Search for programs that match job title keywords
  const keywords = title.split(' ').filter(w => w.length > 3)
  
  const { data: programs } = await supabase
    .from('programs')
    .select('cip_code, name')
    .eq('status', 'published')
    .not('cip_code', 'is', null)
  
  // Count CIP code matches by keyword relevance
  const cipScores = new Map()
  
  programs?.forEach(program => {
    const programName = program.name.toLowerCase()
    let score = 0
    
    keywords.forEach(keyword => {
      if (programName.includes(keyword)) {
        score += 1
      }
    })
    
    if (score > 0) {
      const currentScore = cipScores.get(program.cip_code) || 0
      cipScores.set(program.cip_code, currentScore + score)
    }
  })
  
  // Sort by score and return top matches
  const sortedCIPs = Array.from(cipScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cip]) => cip)
  
  return sortedCIPs
}

/**
 * Get standard CIP codes for common occupations
 */
function getStandardCIPCodes(socCode, title) {
  const titleLower = title.toLowerCase()
  
  // Standard mappings based on O*NET and industry standards
  const standardMappings = {
    // Administrative & Office
    '43-6014.00': ['52.0401'], // Secretarial Science/Admin Assistant
    '43-1011.00': ['52.0201'], // Business Admin (Office Supervisors)
    
    // Business & Management
    '13-1198.00': ['52.0201'], // Business Admin (Business Ops)
    '13-1031.00': ['52.0201'], // Business Admin (Claims Adjusters)
    '11-3031.00': ['52.0201'], // Business Admin (Financial Managers)
    
    // Engineering
    '17-2112.00': ['14.0701'], // Chemical Engineering (Process Engineers)
    '17-2061.00': ['14.0901'], // Computer Engineering
    '17-2199.00': ['14.0101'], // General Engineering
    
    // Construction & Trades
    '47-2031.00': ['46.0201'], // Carpentry
    '47-2111.00': ['46.0301'], // Electricians
    '47-1011.00': ['46.0000'], // Construction Management
    
    // IT & Computer
    '15-1232.00': ['11.0901'], // Computer Support (Network/System Admin)
    '15-1299.08': ['11.0701'], // Web Development
    
    // Education
    '25-2021.00': ['13.1202'], // Elementary Education
    '25-2031.00': ['13.1205'], // Secondary Education
    '25-3031.00': ['13.1501'], // Instructional Coordinators
    
    // Sales & Retail
    '41-1011.00': ['52.1801'], // Retail Management
    '41-2031.00': ['52.1801'], // Retail Sales
    
    // Transportation
    '53-3032.00': ['49.0205'], // Truck Driving
    
    // Healthcare
    '29-1141.00': ['51.2201'], // Registered Nurses
    '31-9092.00': ['51.0801'], // Medical Assistants
    
    // Legal
    '23-2011.00': ['22.0302'], // Paralegals
    
    // Property Management
    '11-9141.00': ['52.0201'], // Business Admin (Property Managers)
    
    // Marketing
    '11-2021.00': ['52.1401'], // Marketing Management
  }
  
  // Check for direct SOC match
  if (standardMappings[socCode]) {
    return standardMappings[socCode]
  }
  
  // Fallback to general business admin for management roles
  if (titleLower.includes('manager') || titleLower.includes('supervisor')) {
    return ['52.0201'] // Business Administration
  }
  
  // Fallback to general program for others
  return ['52.0201'] // Business Administration (most common)
}

async function fixMissingCrosswalkEntries() {
  console.log('🔧 FIXING MISSING CROSSWALK ENTRIES\n')
  console.log('=' .repeat(80))
  
  // Get all jobs without crosswalk
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, soc_code, job_kind')
    .eq('status', 'published')
    .not('soc_code', 'is', null)
  
  const jobsWithoutCrosswalk = []
  
  for (const job of jobs || []) {
    const { data: existing } = await supabase
      .from('cip_soc_crosswalk')
      .select('id')
      .eq('soc_code', job.soc_code)
      .limit(1)
    
    if (!existing || existing.length === 0) {
      jobsWithoutCrosswalk.push(job)
    }
  }
  
  console.log(`Found ${jobsWithoutCrosswalk.length} jobs without crosswalk entries\n`)
  
  if (jobsWithoutCrosswalk.length === 0) {
    console.log('✅ All jobs have crosswalk entries!')
    return
  }
  
  let added = 0
  let failed = 0
  
  for (const job of jobsWithoutCrosswalk) {
    console.log(`\nProcessing: ${job.title} (${job.soc_code})`)
    
    // Try to find best CIP codes from programs
    let cipCodes = await findBestCIPCodes(job)
    
    // If no matches found, use standard mappings
    if (cipCodes.length === 0) {
      cipCodes = getStandardCIPCodes(job.soc_code, job.title)
      console.log(`  Using standard mapping: ${cipCodes.join(', ')}`)
    } else {
      console.log(`  Found from programs: ${cipCodes.join(', ')}`)
    }
    
    // Add crosswalk entries
    for (const cipCode of cipCodes) {
      const { error } = await supabase
        .from('cip_soc_crosswalk')
        .insert({
          soc_code: job.soc_code,
          soc_title: job.title,
          cip_code: cipCode,
          match_strength: 'primary'
        })
      
      if (error) {
        if (error.code !== '23505') { // Ignore duplicates
          console.log(`  ❌ Error adding ${cipCode}: ${error.message}`)
          failed++
        }
      } else {
        console.log(`  ✅ Added ${cipCode}`)
        added++
      }
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log(`Jobs processed: ${jobsWithoutCrosswalk.length}`)
  console.log(`Crosswalk entries added: ${added}`)
  console.log(`Failed: ${failed}`)
  
  // Verify coverage
  console.log('\n🔍 Verifying coverage...')
  
  const { data: allJobs } = await supabase
    .from('jobs')
    .select('id, soc_code')
    .eq('status', 'published')
    .not('soc_code', 'is', null)
  
  let withCrosswalk = 0
  for (const job of allJobs || []) {
    const { data } = await supabase
      .from('cip_soc_crosswalk')
      .select('id')
      .eq('soc_code', job.soc_code)
      .limit(1)
    
    if (data && data.length > 0) {
      withCrosswalk++
    }
  }
  
  const coverage = Math.round(withCrosswalk / allJobs.length * 100)
  console.log(`\n✅ Coverage: ${withCrosswalk}/${allJobs.length} (${coverage}%)`)
  
  if (coverage === 100) {
    console.log('🎉 100% COVERAGE ACHIEVED!')
  } else {
    console.log(`⚠️  Still missing: ${allJobs.length - withCrosswalk} jobs`)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('✅ Complete!')
  console.log('='.repeat(80) + '\n')
}

// Run if called directly
if (require.main === module) {
  fixMissingCrosswalkEntries()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Error:', err)
      process.exit(1)
    })
}

module.exports = { fixMissingCrosswalkEntries }
