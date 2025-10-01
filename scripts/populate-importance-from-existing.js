/**
 * Populate O*NET Importance from Existing Data
 * 
 * We already have O*NET importance in job_skills.onet_data_source.importance
 * This script copies that data to skills.onet_importance for easier access
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function populateFromExisting() {
  console.log('🔄 Populating O*NET importance from existing job_skills data...\n')

  // Get all job_skills with O*NET data
  const { data: jobSkills, error } = await supabase
    .from('job_skills')
    .select('skill_id, onet_data_source, skills(id, name, onet_importance)')
    .not('onet_data_source', 'is', null)

  if (error) {
    console.error('Error fetching job_skills:', error)
    return
  }

  console.log(`Found ${jobSkills.length} job_skills with O*NET data\n`)

  // Group by skill_id and calculate average importance
  const skillImportanceMap = new Map()

  for (const js of jobSkills) {
    const skill = js.skills
    if (!skill) continue

    const importance = js.onet_data_source?.importance
    if (!importance) continue

    if (!skillImportanceMap.has(skill.id)) {
      skillImportanceMap.set(skill.id, {
        name: skill.name,
        importances: [],
        currentImportance: skill.onet_importance
      })
    }

    skillImportanceMap.get(skill.id).importances.push(importance)
  }

  console.log(`Processing ${skillImportanceMap.size} unique skills\n`)

  let updated = 0
  let skipped = 0

  for (const [skillId, data] of skillImportanceMap) {
    // Skip if already has importance
    if (data.currentImportance) {
      skipped++
      continue
    }

    // Calculate average importance across all jobs
    const avgImportance = data.importances.reduce((sum, val) => sum + val, 0) / data.importances.length

    // Update skill
    const { error: updateError } = await supabase
      .from('skills')
      .update({ onet_importance: avgImportance })
      .eq('id', skillId)

    if (updateError) {
      console.error(`❌ Error updating ${data.name}:`, updateError.message)
    } else {
      console.log(`✅ ${data.name}: ${avgImportance.toFixed(1)} (from ${data.importances.length} jobs)`)
      updated++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 IMPORTANCE POPULATION SUMMARY:')
  console.log(`  Total unique skills: ${skillImportanceMap.size}`)
  console.log(`  Updated with importance: ${updated}`)
  console.log(`  Already had importance: ${skipped}`)
  console.log('='.repeat(60))
}

// Run the population
populateFromExisting()
  .then(() => {
    console.log('\n✅ Importance population complete!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Population failed:', error)
    process.exit(1)
  })
