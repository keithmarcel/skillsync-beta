/**
 * Populate O*NET Importance Scores
 * 
 * This script fetches O*NET importance ratings for skills and populates
 * the onet_importance column in the skills table.
 * 
 * O*NET provides importance ratings (1.0-5.0) for skills within each occupation.
 * We'll use these ratings for question-level weighting in assessments.
 */

const { createClient } = require('@supabase/supabase-js')
const https = require('https')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// O*NET API credentials
const ONET_USERNAME = process.env.ONET_USERNAME || 'skillsync_beta'
const ONET_PASSWORD = process.env.ONET_PASSWORD || ''

/**
 * Fetch O*NET skills for a SOC code
 */
async function fetchONETSkills(socCode) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${ONET_USERNAME}:${ONET_PASSWORD}`).toString('base64')
    
    const options = {
      hostname: 'services.onetcenter.org',
      path: `/ws/online/occupations/${socCode}/skills`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve(json.skill || [])
        } catch (e) {
          console.error('Error parsing O*NET response:', e)
          resolve([])
        }
      })
    })

    req.on('error', (e) => {
      console.error('Error fetching O*NET data:', e)
      resolve([])
    })

    req.setTimeout(10000, () => {
      req.destroy()
      console.error('O*NET request timeout')
      resolve([])
    })

    req.end()
  })
}

/**
 * Map skill name to O*NET skill (fuzzy matching)
 */
function findONETMatch(skillName, onetSkills) {
  const normalized = skillName.toLowerCase().trim()
  
  // Try exact match first
  let match = onetSkills.find(onet => 
    onet.element_name.toLowerCase() === normalized
  )
  
  if (match) return match
  
  // Try contains match
  match = onetSkills.find(onet => 
    onet.element_name.toLowerCase().includes(normalized) ||
    normalized.includes(onet.element_name.toLowerCase())
  )
  
  return match
}

async function populateONETImportance() {
  console.log('🔄 Populating O*NET importance scores...\n')

  // Get all unique SOC codes from jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('soc_code')
    .not('soc_code', 'is', null)

  if (!jobs) {
    console.error('No jobs found')
    return
  }

  const uniqueSOCs = [...new Set(jobs.map(j => j.soc_code))]
  console.log(`Found ${uniqueSOCs.length} unique SOC codes\n`)

  let totalSkillsProcessed = 0
  let totalImportanceScoresAdded = 0

  for (const socCode of uniqueSOCs) {
    console.log(`\n📋 Processing SOC: ${socCode}`)

    // Get O*NET skills for this SOC
    const onetSkills = await fetchONETSkills(socCode)
    
    if (onetSkills.length === 0) {
      console.log('  ⚠️  No O*NET skills found')
      continue
    }

    console.log(`  Found ${onetSkills.length} O*NET skills`)

    // Get job skills for this SOC
    const { data: jobSkills } = await supabase
      .from('job_skills')
      .select('skill_id, skills(id, name, onet_importance), jobs!inner(soc_code)')
      .eq('jobs.soc_code', socCode)

    if (!jobSkills || jobSkills.length === 0) {
      console.log('  ⚠️  No job skills found')
      continue
    }

    // Get unique skills
    const uniqueSkills = new Map()
    jobSkills.forEach(js => {
      const skill = js.skills
      if (skill && !uniqueSkills.has(skill.id)) {
        uniqueSkills.set(skill.id, skill)
      }
    })

    console.log(`  Processing ${uniqueSkills.size} unique skills`)

    for (const [skillId, skill] of uniqueSkills) {
      totalSkillsProcessed++

      // Skip if already has importance score
      if (skill.onet_importance) {
        continue
      }

      // Find matching O*NET skill
      const onetMatch = findONETMatch(skill.name, onetSkills)

      if (onetMatch && onetMatch.scale) {
        const importance = parseFloat(onetMatch.scale.value)
        
        // Update skill with O*NET importance
        const { error } = await supabase
          .from('skills')
          .update({ 
            onet_importance: importance,
            onet_id: onetMatch.element_id
          })
          .eq('id', skillId)

        if (error) {
          console.error(`  ❌ Error updating ${skill.name}:`, error.message)
        } else {
          console.log(`  ✅ ${skill.name}: ${importance.toFixed(1)}`)
          totalImportanceScoresAdded++
        }
      } else {
        console.log(`  ⚠️  No O*NET match for: ${skill.name}`)
      }

      // Rate limit: 10 requests per second
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 IMPORTANCE POPULATION SUMMARY:')
  console.log(`  Total skills processed: ${totalSkillsProcessed}`)
  console.log(`  Importance scores added: ${totalImportanceScoresAdded}`)
  console.log(`  Skills without O*NET match: ${totalSkillsProcessed - totalImportanceScoresAdded}`)
  console.log('='.repeat(60))
}

// Run the population
populateONETImportance()
  .then(() => {
    console.log('\n✅ O*NET importance population complete!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Population failed:', error)
    process.exit(1)
  })
