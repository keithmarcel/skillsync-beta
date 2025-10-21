#!/usr/bin/env node

/**
 * Sync CIP-SOC Crosswalk with Actual Program CIP Codes
 * 
 * Problem: NCES crosswalk data sometimes maps to generic/outdated CIP codes
 * that don't match what education providers actually use.
 * 
 * Solution: This script analyzes actual programs in the database and updates
 * the crosswalk to use CIP codes that programs actually have, ensuring the
 * crosswalk stays in sync with real-world data.
 * 
 * Run this whenever:
 * - New programs are added
 * - Program CIP codes are updated
 * - You notice crosswalk mismatches
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function syncCrosswalk() {
  console.log('🔄 Syncing CIP-SOC Crosswalk with Actual Programs...\n')

  try {
    // 1. Get all jobs with SOC codes
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('soc_code, title')
      .not('soc_code', 'is', null)

    if (jobsError) throw jobsError

    const uniqueSOCs = [...new Set(jobs.map(j => j.soc_code))]
    console.log(`📊 Found ${uniqueSOCs.length} unique SOC codes in jobs\n`)

    let updatedCount = 0
    let addedCount = 0
    let skippedCount = 0

    for (const socCode of uniqueSOCs) {
      // 2. Get current crosswalk mapping
      const { data: currentMapping } = await supabase
        .from('cip_soc_crosswalk')
        .select('cip_code')
        .eq('soc_code', socCode)

      const currentCIPs = currentMapping?.map(m => m.cip_code) || []

      // 3. Find programs that could relate to this SOC
      // Strategy: Look for programs whose names/descriptions relate to the job titles
      const jobTitles = jobs.filter(j => j.soc_code === socCode).map(j => j.title)
      const searchTerms = jobTitles.flatMap(title => 
        title.toLowerCase().split(/\s+/).filter(word => word.length > 4)
      )

      // Get programs that might match
      const { data: relatedPrograms } = await supabase
        .from('programs')
        .select('cip_code, name')
        .not('cip_code', 'is', null)
        .eq('status', 'published')

      // Filter programs that have relevant keywords
      const matchingPrograms = relatedPrograms?.filter(p => {
        const programName = p.name.toLowerCase()
        return searchTerms.some(term => programName.includes(term))
      }) || []

      if (matchingPrograms.length === 0) {
        skippedCount++
        continue
      }

      // Get unique CIP codes from matching programs
      const programCIPs = [...new Set(matchingPrograms.map(p => p.cip_code))]

      // 4. Update crosswalk with program CIP codes
      for (const cipCode of programCIPs) {
        if (!currentCIPs.includes(cipCode)) {
          // Add new mapping
          const { error: insertError } = await supabase
            .from('cip_soc_crosswalk')
            .insert({
              soc_code: socCode,
              cip_code: cipCode,
              source: 'program_sync',
              weight: 1.0
            })

          if (!insertError) {
            console.log(`✅ Added: ${socCode} → ${cipCode}`)
            console.log(`   Programs: ${matchingPrograms.filter(p => p.cip_code === cipCode).map(p => p.name).join(', ')}`)
            addedCount++
          }
        }
      }

      // 5. Remove mappings that have no programs
      for (const cipCode of currentCIPs) {
        const { data: programsWithCIP } = await supabase
          .from('programs')
          .select('id')
          .eq('cip_code', cipCode)
          .eq('status', 'published')
          .limit(1)

        if (!programsWithCIP || programsWithCIP.length === 0) {
          const { error: deleteError } = await supabase
            .from('cip_soc_crosswalk')
            .delete()
            .eq('soc_code', socCode)
            .eq('cip_code', cipCode)
            .eq('source', 'NCES') // Only remove NCES mappings, not manual ones

          if (!deleteError) {
            console.log(`🗑️  Removed: ${socCode} → ${cipCode} (no programs)`)
            updatedCount++
          }
        }
      }
    }

    console.log('\n✨ Sync Complete!')
    console.log(`   Added: ${addedCount} new mappings`)
    console.log(`   Removed: ${updatedCount} obsolete mappings`)
    console.log(`   Skipped: ${skippedCount} SOCs (no matching programs)`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  syncCrosswalk()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}

module.exports = { syncCrosswalk }
