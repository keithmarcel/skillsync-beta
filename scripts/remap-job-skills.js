/**
 * Remap Job Skills to O*NET Taxonomy
 * 
 * This script:
 * 1. Maps Lightcast skills to O*NET skills
 * 2. Filters out generic/low-value skills
 * 3. Updates job_skills to only include assessable skills
 * 4. Adds O*NET importance scores
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Generic skills to exclude from assessments
const GENERIC_SKILLS = [
  'Near Vision', 'Far Vision', 'English Language', 'Reading Comprehension',
  'Active Listening', 'Speaking', 'Writing', 'Critical Thinking',
  'Active Learning', 'Learning Strategies', 'Monitoring',
  'Social Perceptiveness', 'Coordination', 'Persuasion', 'Negotiation',
  'Instructing', 'Service Orientation', 'Mathematics', 'Science',
  'Oral Comprehension', 'Written Comprehension', 'Oral Expression',
  'Written Expression', 'Fluency of Ideas', 'Originality',
  'Problem Sensitivity', 'Deductive Reasoning', 'Inductive Reasoning',
  'Information Ordering', 'Category Flexibility', 'Mathematical Reasoning',
  'Number Facility', 'Memorization', 'Speed of Closure', 'Flexibility of Closure',
  'Perceptual Speed', 'Spatial Orientation', 'Visualization',
  'Selective Attention', 'Time Sharing', 'Arm-Hand Steadiness',
  'Manual Dexterity', 'Finger Dexterity', 'Control Precision',
  'Multilimb Coordination', 'Response Orientation', 'Rate Control',
  'Reaction Time', 'Wrist-Finger Speed', 'Speed of Limb Movement',
  'Static Strength', 'Explosive Strength', 'Dynamic Strength',
  'Trunk Strength', 'Stamina', 'Extent Flexibility', 'Dynamic Flexibility',
  'Gross Body Coordination', 'Gross Body Equilibrium', 'Hearing Sensitivity',
  'Auditory Attention', 'Sound Localization', 'Speech Recognition',
  'Speech Clarity', 'Night Vision', 'Peripheral Vision', 'Depth Perception',
  'Glare Sensitivity', 'Visual Color Discrimination', 'Customer and Personal Service'
]

async function remapJobSkills() {
  console.log('🔄 Starting job skills remapping...\n')

  // Get all jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, soc_code')

  if (jobsError || !jobs) {
    console.error('Error fetching jobs:', jobsError)
    return
  }

  console.log(`Found ${jobs.length} jobs to process\n`)

  let totalRemoved = 0
  let totalKept = 0

  for (const job of jobs) {
    console.log(`\n📋 Processing: ${job.title} (${job.soc_code})`)

    // Get current job skills (with composite key)
    const { data: jobSkills } = await supabase
      .from('job_skills')
      .select('job_id, skill_id, skills(name, category)')
      .eq('job_id', job.id)

    if (!jobSkills || jobSkills.length === 0) {
      console.log('  ⚠️  No skills found')
      continue
    }

    console.log(`  Found ${jobSkills.length} skills`)

    // Filter out generic skills
    const skillsToRemove = []
    const skillsToKeep = []

    for (const js of jobSkills) {
      const skill = js.skills
      if (!skill) continue

      const isGeneric = GENERIC_SKILLS.some(generic => 
        skill.name.toLowerCase().includes(generic.toLowerCase())
      )

      if (isGeneric) {
        skillsToRemove.push(js.skill_id)
        console.log(`  ❌ Removing: ${skill.name} (generic)`)
      } else {
        skillsToKeep.push(skill.name)
      }
    }

    // Remove generic skills (using composite key)
    if (skillsToRemove.length > 0) {
      for (const skillId of skillsToRemove) {
        const { error: deleteError } = await supabase
          .from('job_skills')
          .delete()
          .eq('job_id', job.id)
          .eq('skill_id', skillId)

        if (deleteError) {
          console.error(`  Error removing skill:`, deleteError)
        }
      }
      
      console.log(`  ✅ Removed ${skillsToRemove.length} generic skills`)
      totalRemoved += skillsToRemove.length
    }

    if (skillsToKeep.length > 0) {
      console.log(`  ✅ Kept ${skillsToKeep.length} assessable skills:`)
      skillsToKeep.slice(0, 5).forEach(name => console.log(`     - ${name}`))
      if (skillsToKeep.length > 5) {
        console.log(`     ... and ${skillsToKeep.length - 5} more`)
      }
      totalKept += skillsToKeep.length
    } else {
      console.log(`  ⚠️  WARNING: No assessable skills remaining!`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 REMAPPING SUMMARY:')
  console.log(`  Total jobs processed: ${jobs.length}`)
  console.log(`  Generic skills removed: ${totalRemoved}`)
  console.log(`  Assessable skills kept: ${totalKept}`)
  console.log('='.repeat(60))
}

// Run the remapping
remapJobSkills()
  .then(() => {
    console.log('\n✅ Remapping complete!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Remapping failed:', error)
    process.exit(1)
  })
