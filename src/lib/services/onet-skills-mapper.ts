/**
 * O*NET Skills Mapper for Standard Occupations
 * 
 * Uses O*NET API to get broad, universal skills for SOC codes.
 * Filters out only truly generic abilities while keeping domain knowledge.
 * 
 * Use for: Standard occupations (HDO quizzes)
 * Don't use for: Featured roles (use hybrid-skills-mapper.ts instead)
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ONetSkill {
  id: string
  name: string
  description: string
  importance: number // 1-5 scale
  level: number // 1-7 scale
  category: 'knowledge' | 'skill' | 'ability'
}

/**
 * Generic abilities to exclude (not assessable via quiz)
 */
const GENERIC_ABILITIES = [
  'Near Vision', 'Far Vision', 'Visual Color Discrimination',
  'Hearing Sensitivity', 'Auditory Attention', 'Sound Localization',
  'Speech Recognition', 'Speech Clarity',
  'Arm-Hand Steadiness', 'Manual Dexterity', 'Finger Dexterity',
  'Multilimb Coordination', 'Control Precision',
  'Stamina', 'Static Strength', 'Dynamic Strength', 'Trunk Strength',
  'Oral Comprehension', 'Written Comprehension', 'Oral Expression', 'Written Expression',
  'Fluency of Ideas', 'Originality', 'Problem Sensitivity',
  'Deductive Reasoning', 'Inductive Reasoning', 'Information Ordering',
  'Category Flexibility', 'Mathematical Reasoning', 'Number Facility',
  'Memorization', 'Speed of Closure', 'Flexibility of Closure',
  'Perceptual Speed', 'Spatial Orientation', 'Visualization',
  'Selective Attention', 'Time Sharing', 'Response Orientation',
  'Rate Control', 'Reaction Time', 'Wrist-Finger Speed', 'Speed of Limb Movement'
]

/**
 * Generic soft skills to exclude (hard to assess objectively)
 */
const GENERIC_SOFT_SKILLS = [
  'Active Listening', 'Speaking', 'Reading Comprehension', 'Writing',
  'Critical Thinking', 'Active Learning', 'Learning Strategies',
  'Monitoring', 'Social Perceptiveness', 'Coordination',
  'Persuasion', 'Negotiation', 'Instructing', 'Service Orientation',
  'English Language', 'Customer and Personal Service'
]

/**
 * Fetch skills from O*NET API for a SOC code
 */
async function fetchONetSkills(socCode: string): Promise<ONetSkill[]> {
  const username = process.env.ONET_USERNAME
  const password = process.env.ONET_PASSWORD

  if (!username || !password) {
    console.warn('O*NET credentials not configured')
    return []
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64')
  const baseUrl = 'https://services.onetcenter.org/ws/online/occupations'

  try {
    // Fetch Knowledge, Skills, and Abilities
    const [knowledge, skills, abilities] = await Promise.all([
      fetch(`${baseUrl}/${socCode}/knowledge`, {
        headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
      }).then(r => r.ok ? r.json() : { element: [] }),
      
      fetch(`${baseUrl}/${socCode}/skills`, {
        headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
      }).then(r => r.ok ? r.json() : { element: [] }),
      
      fetch(`${baseUrl}/${socCode}/abilities`, {
        headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
      }).then(r => r.ok ? r.json() : { element: [] })
    ])

    const allSkills: ONetSkill[] = []

    // Process Knowledge (highest priority - domain-specific)
    knowledge.element?.forEach((item: any) => {
      if (item.scale?.id === 'IM' && item.value >= 3.0) { // Importance >= 3
        allSkills.push({
          id: item.id,
          name: item.name,
          description: item.description || '',
          importance: item.value,
          level: 0,
          category: 'knowledge'
        })
      }
    })

    // Process Skills (medium priority - professional skills)
    skills.element?.forEach((item: any) => {
      if (item.scale?.id === 'IM' && item.value >= 3.5) { // Importance >= 3.5
        allSkills.push({
          id: item.id,
          name: item.name,
          description: item.description || '',
          importance: item.value,
          level: 0,
          category: 'skill'
        })
      }
    })

    // Process Abilities (low priority - only if importance >= 4.0)
    abilities.element?.forEach((item: any) => {
      if (item.scale?.id === 'IM' && item.value >= 4.0) {
        allSkills.push({
          id: item.id,
          name: item.name,
          description: item.description || '',
          importance: item.value,
          level: 0,
          category: 'ability'
        })
      }
    })

    return allSkills

  } catch (error) {
    console.error('O*NET API error:', error)
    return []
  }
}

/**
 * Filter out generic abilities and soft skills
 */
function filterAssessableSkills(skills: ONetSkill[]): ONetSkill[] {
  return skills.filter(skill => {
    // Exclude generic abilities
    if (GENERIC_ABILITIES.includes(skill.name)) {
      return false
    }

    // Exclude generic soft skills
    if (GENERIC_SOFT_SKILLS.includes(skill.name)) {
      return false
    }

    // Keep domain-specific knowledge and professional skills
    return true
  })
}

/**
 * Main function: Get O*NET skills for standard occupation
 */
export async function getONetSkillsForOccupation(socCode: string): Promise<{
  skillId: string
  skillName: string
  importance: number
  category: string
}[]> {
  console.log(`\n📚 Fetching O*NET skills for SOC: ${socCode}`)

  // Fetch from O*NET API
  const onetSkills = await fetchONetSkills(socCode)
  console.log(`  Found ${onetSkills.length} total O*NET skills`)

  // Filter to assessable skills
  const assessableSkills = filterAssessableSkills(onetSkills)
  console.log(`  Filtered to ${assessableSkills.length} assessable skills`)

  // Sort by importance and take top 15
  const topSkills = assessableSkills
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 15)

  // Create/get skills in database
  const results = []

  for (const onetSkill of topSkills) {
    // Check if skill exists
    let { data: existingSkill } = await supabase
      .from('skills')
      .select('id')
      .eq('onet_id', onetSkill.id)
      .single()

    let skillId: string

    if (existingSkill) {
      skillId = existingSkill.id
    } else {
      // Create new skill
      const { data: newSkill } = await supabase
        .from('skills')
        .insert({
          name: onetSkill.name,
          description: onetSkill.description,
          category: onetSkill.category === 'knowledge' ? 'Knowledge' : 
                   onetSkill.category === 'skill' ? 'Professional Skill' : 'Ability',
          source: 'ONET',
          onet_id: onetSkill.id,
          onet_importance: onetSkill.importance,
          is_assessable: true
        })
        .select('id')
        .single()

      skillId = newSkill?.id || ''
    }

    if (skillId) {
      results.push({
        skillId,
        skillName: onetSkill.name,
        importance: onetSkill.importance,
        category: onetSkill.category
      })
    }
  }

  console.log(`  ✅ Prepared ${results.length} skills for occupation`)
  return results
}

/**
 * Save O*NET skills to job
 */
export async function saveONetSkillsToJob(
  jobId: string,
  skills: { skillId: string; skillName: string; importance: number; category: string }[]
): Promise<{ success: boolean; count: number }> {
  
  const jobSkills = skills.map(skill => ({
    job_id: jobId,
    skill_id: skill.skillId,
    importance_level: skill.importance >= 4.5 ? 'critical' as const :
                     skill.importance >= 3.5 ? 'important' as const : 'helpful' as const,
    proficiency_threshold: skill.importance >= 4.5 ? 80 :
                          skill.importance >= 3.5 ? 70 : 60,
    weight: skill.importance / 5.0, // Normalize to 0-1
    onet_data_source: {
      source: 'ONET_API',
      category: skill.category,
      importance: skill.importance,
      validated: true
    }
  }))

  const { error } = await supabase
    .from('job_skills')
    .upsert(jobSkills, { onConflict: 'job_id,skill_id' })

  if (error) {
    console.error('Error saving O*NET skills:', error)
    return { success: false, count: 0 }
  }

  return { success: true, count: jobSkills.length }
}
