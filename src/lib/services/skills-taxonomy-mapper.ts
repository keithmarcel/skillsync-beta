/**
 * Skills Taxonomy Mapper
 * 
 * Maps Lightcast skills to O*NET skills and filters out generic/low-value skills
 * for better assessment quality.
 * 
 * Problem: O*NET includes generic abilities like "Near Vision", "English Language"
 * Solution: Filter to domain-specific, technical, and specialized skills only
 */

import { supabase } from '@/lib/supabase/client'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// O*NET skill categories to EXCLUDE (too generic for assessments)
const EXCLUDED_ONET_CATEGORIES = [
  'Basic Skills',           // Reading, Writing, Speaking - too generic
  'Cross-Functional Skills', // Active Listening, Critical Thinking - hard to assess
  'Abilities',              // Near Vision, Oral Comprehension - physical/cognitive abilities
  'Work Styles',            // Dependability, Attention to Detail - personality traits
]

// O*NET skill categories to INCLUDE (good for assessments)
const INCLUDED_ONET_CATEGORIES = [
  'Knowledge',              // Domain-specific knowledge (e.g., Mathematics, Engineering)
  'Technical Skills',       // Specific technical competencies
  'Tools & Technology',     // Software, equipment, tools
]

// Lightcast categories to prioritize
const HIGH_VALUE_LIGHTCAST_CATEGORIES = [
  'Specialized Skill',      // Technical, domain-specific
  'Software Skill',         // Specific software/tools
  'IT Skill',              // Technology skills
  'Hard Skill',            // Measurable technical skills
]

const LOW_VALUE_LIGHTCAST_CATEGORIES = [
  'Common Skill',          // Generic skills everyone has
  'Soft Skill',            // Hard to objectively assess
  'Certification',         // Binary (have it or don't) - not good for proficiency testing
]

interface SkillMappingResult {
  lightcast_id: string
  onet_id: string | null
  onet_importance: number | null
  should_assess: boolean
  exclusion_reason?: string
}

/**
 * Fetch O*NET skills for a given SOC code
 */
export async function fetchONETSkills(socCode: string): Promise<any[]> {
  try {
    // Use our existing O*NET API integration
    const response = await fetch(`https://services.onetcenter.org/ws/online/occupations/${socCode}/skills`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.ONET_USERNAME}:${process.env.ONET_PASSWORD}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`O*NET API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    return data.skill || []
  } catch (error) {
    console.error('Error fetching O*NET skills:', error)
    return []
  }
}

/**
 * Determine if a skill should be used for assessments
 */
export function shouldAssessSkill(
  skillName: string,
  category: string,
  onetCategory?: string
): { should_assess: boolean; reason?: string } {
  // Exclude low-value Lightcast categories
  if (LOW_VALUE_LIGHTCAST_CATEGORIES.includes(category)) {
    return {
      should_assess: false,
      reason: `Low-value category: ${category}`
    }
  }

  // Exclude generic O*NET categories
  if (onetCategory && EXCLUDED_ONET_CATEGORIES.some(cat => onetCategory.includes(cat))) {
    return {
      should_assess: false,
      reason: `Generic O*NET category: ${onetCategory}`
    }
  }

  // Exclude specific generic skills by name
  const genericSkillNames = [
    'Near Vision',
    'Far Vision',
    'English Language',
    'Reading Comprehension',
    'Active Listening',
    'Speaking',
    'Writing',
    'Critical Thinking',
    'Active Learning',
    'Learning Strategies',
    'Monitoring',
    'Social Perceptiveness',
    'Coordination',
    'Persuasion',
    'Negotiation',
    'Instructing',
    'Service Orientation',
    'Complex Problem Solving',
    'Operations Analysis',
    'Technology Design',
    'Equipment Selection',
    'Installation',
    'Programming', // Too generic - prefer specific languages
    'Quality Control Analysis',
    'Operations Monitoring',
    'Operation and Control',
    'Equipment Maintenance',
    'Troubleshooting',
    'Repairing',
    'Judgment and Decision Making',
    'Systems Analysis',
    'Systems Evaluation',
    'Time Management',
    'Management of Financial Resources',
    'Management of Material Resources',
    'Management of Personnel Resources',
  ]

  if (genericSkillNames.some(generic => skillName.toLowerCase().includes(generic.toLowerCase()))) {
    return {
      should_assess: false,
      reason: `Generic skill name: ${skillName}`
    }
  }

  // Prioritize high-value categories
  if (HIGH_VALUE_LIGHTCAST_CATEGORIES.includes(category)) {
    return { should_assess: true }
  }

  // Default: assess if it's specific enough
  return { should_assess: true }
}

/**
 * Map Lightcast skills to O*NET and determine assessment suitability
 */
export async function mapSkillsForJob(
  jobId: string,
  socCode: string
): Promise<SkillMappingResult[]> {
  console.log(`Mapping skills for job ${jobId} (SOC: ${socCode})`)

  // 1. Get O*NET skills for this SOC
  const onetSkills = await fetchONETSkills(socCode)
  console.log(`Found ${onetSkills.length} O*NET skills`)

  // 2. Get current job skills from Lightcast
  const { data: jobSkills } = await supabaseAdmin
    .from('job_skills')
    .select('skill_id, skills(id, name, category, lightcast_id, onet_id)')
    .eq('job_id', jobId)

  if (!jobSkills || jobSkills.length === 0) {
    console.log('No job skills found')
    return []
  }

  console.log(`Found ${jobSkills.length} Lightcast skills for job`)

  // 3. Map and filter skills
  const mappedSkills: SkillMappingResult[] = []

  for (const jobSkill of jobSkills) {
    const skill = jobSkill.skills as any
    if (!skill) continue

    // Try to find matching O*NET skill by name similarity
    const onetMatch = onetSkills.find(onet => 
      onet.name.toLowerCase() === skill.name.toLowerCase() ||
      onet.name.toLowerCase().includes(skill.name.toLowerCase()) ||
      skill.name.toLowerCase().includes(onet.name.toLowerCase())
    )

    // Determine if skill should be assessed
    const assessmentCheck = shouldAssessSkill(
      skill.name,
      skill.category,
      onetMatch?.category
    )

    mappedSkills.push({
      lightcast_id: skill.lightcast_id,
      onet_id: onetMatch?.id || null,
      onet_importance: onetMatch?.importance || null,
      should_assess: assessmentCheck.should_assess,
      exclusion_reason: assessmentCheck.reason
    })
  }

  return mappedSkills
}

/**
 * Update job skills with O*NET mapping and assessment flags
 */
export async function updateJobSkillsMapping(
  jobId: string,
  socCode: string
): Promise<{
  total: number
  mapped: number
  assessable: number
  excluded: number
}> {
  const mappedSkills = await mapSkillsForJob(jobId, socCode)

  let mapped = 0
  let assessable = 0
  let excluded = 0

  for (const mapping of mappedSkills) {
    // Update skill with O*NET data
    if (mapping.onet_id) {
      await supabaseAdmin
        .from('skills')
        .update({
          onet_id: mapping.onet_id,
          onet_importance: mapping.onet_importance
        })
        .eq('lightcast_id', mapping.lightcast_id)

      mapped++
    }

    // Track assessment suitability
    if (mapping.should_assess) {
      assessable++
    } else {
      excluded++
      console.log(`Excluding skill: ${mapping.exclusion_reason}`)
    }
  }

  return {
    total: mappedSkills.length,
    mapped,
    assessable,
    excluded
  }
}

/**
 * Get assessable skills for a job (filtered, high-quality skills only)
 */
export async function getAssessableSkills(jobId: string) {
  const { data: jobSkills } = await supabase
    .from('job_skills')
    .select(`
      *,
      skill:skills(
        id,
        name,
        category,
        onet_id,
        onet_importance
      )
    `)
    .eq('job_id', jobId)

  if (!jobSkills) return []

  // Filter to assessable skills only
  return jobSkills.filter(js => {
    const skill = js.skill as any
    if (!skill) return false

    const check = shouldAssessSkill(skill.name, skill.category)
    return check.should_assess
  })
}

export default {
  fetchONETSkills,
  shouldAssessSkill,
  mapSkillsForJob,
  updateJobSkillsMapping,
  getAssessableSkills
}
