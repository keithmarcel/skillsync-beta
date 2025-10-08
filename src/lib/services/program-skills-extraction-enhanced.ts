/**
 * Enhanced Program Skills Extraction Service
 * Combines traditional CIP→SOC→Skills pipeline with LAiSER AI extraction
 */

import { supabase } from '@/lib/supabase/client'
import LaiserProgramSkillsService from './laiser-program-skills'

export interface SkillWithWeight {
  skill_id: string
  skill_name: string
  weight: number
  frequency: number
  importance: number
  source: 'traditional' | 'laiser_ai' | 'hybrid'
  confidence?: number
}

export interface ExtractionResult {
  programId: string
  programName: string
  cipCode: string
  socCodes: string[]
  allSkills: SkillWithWeight[]
  topSkills: SkillWithWeight[]
  success: boolean
  method: 'traditional' | 'laiser' | 'hybrid'
  laiserConfidence?: number
  error?: string
}

/**
 * Enhanced program skills extraction with LAiSER integration
 */
export async function extractSkillsForProgramEnhanced(
  programId: string,
  useLaiser: boolean = true
): Promise<ExtractionResult> {

  const laiserService = new LaiserProgramSkillsService()

  // Check if LAiSER is available
  const laiserAvailable = useLaiser ? await laiserService.laiserService.checkAvailability() : false

  if (laiserAvailable) {
    // Use LAiSER-enhanced extraction
    return await extractWithLaiser(programId, laiserService)
  } else {
    // Fall back to traditional method
    return await extractTraditional(programId)
  }
}

/**
 * Extract skills using LAiSER AI + traditional pipeline
 */
async function extractWithLaiser(
  programId: string,
  laiserService: LaiserProgramSkillsService
): Promise<ExtractionResult> {

  try {
    // Get traditional skills first
    const traditionalResult = await extractTraditional(programId)

    if (!traditionalResult.success) {
      return traditionalResult
    }

    // Enhance with LAiSER
    const laiserResult = await laiserService.extractProgramSkills(programId)

    // Combine results
    const combinedSkills = await combineSkills(
      traditionalResult.allSkills,
      laiserResult,
      programId
    )

    // Select top skills
    const topSkills = selectTopSkills(combinedSkills)

    return {
      programId,
      programName: traditionalResult.programName,
      cipCode: traditionalResult.cipCode,
      socCodes: traditionalResult.socCodes,
      allSkills: combinedSkills,
      topSkills,
      success: true,
      method: 'hybrid',
      laiserConfidence: laiserResult.confidence_score
    }

  } catch (error) {
    console.error(`LAiSER extraction failed, falling back to traditional:`, error)

    // Fallback to traditional method
    return await extractTraditional(programId)
  }
}

/**
 * Combine traditional and LAiSER skills intelligently
 */
async function combineSkills(
  traditionalSkills: SkillWithWeight[],
  laiserResult: any,
  programId: string
): Promise<SkillWithWeight[]> {

  const combinedMap = new Map<string, SkillWithWeight>()

  // Add traditional skills
  for (const skill of traditionalSkills) {
    combinedMap.set(skill.skill_name.toLowerCase(), {
      ...skill,
      source: 'traditional'
    })
  }

  // Add LAiSER skills with enhancement
  const { data: laiserMappings } = await supabase
    .from('program_skills')
    .select(`
      skill:skills(name),
      coverage_level,
      weight
    `)
    .eq('program_id', programId)

  for (const mapping of laiserMappings || []) {
    const skillName = mapping.skill?.name
    if (!skillName) continue

    const key = skillName.toLowerCase()
    const existing = combinedMap.get(key)

    if (existing) {
      // Enhance existing skill with LAiSER data
      combinedMap.set(key, {
        ...existing,
        source: 'hybrid',
        weight: Math.max(existing.weight, mapping.weight),
        confidence: mapping.confidence || 0.8
      })
    } else {
      // Add new LAiSER skill
      combinedMap.set(key, {
        skill_id: await findOrCreateSkill(skillName),
        skill_name: skillName,
        weight: mapping.weight,
        frequency: 1,
        importance: 3.0, // Default
        source: 'laiser_ai',
        confidence: mapping.confidence || 0.8
      })
    }
  }

  return Array.from(combinedMap.values())
}

/**
 * Find existing skill or create new one
 */
async function findOrCreateSkill(skillName: string): Promise<string> {
  // Try to find existing skill
  const { data: existing } = await supabase
    .from('skills')
    .select('id')
    .ilike('name', `%${skillName}%`)
    .limit(1)
    .single()

  if (existing) {
    return existing.id
  }

  // Create new skill
  const { data: newSkill } = await supabase
    .from('skills')
    .insert({
      name: skillName,
      source: 'LAISER',
      is_assessable: true
    })
    .select('id')
    .single()

  return newSkill.id
}

/**
 * Select top skills based on combined weights and sources
 */
function selectTopSkills(allSkills: SkillWithWeight[]): SkillWithWeight[] {
  return allSkills
    .sort((a, b) => {
      // Prioritize hybrid > laiser_ai > traditional
      const sourcePriority = { hybrid: 3, laiser_ai: 2, traditional: 1 }
      const aPriority = sourcePriority[a.source] || 1
      const bPriority = sourcePriority[b.source] || 1

      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }

      // Then by weight
      return b.weight - a.weight
    })
    .slice(0, 15) // Top 15 skills
}

/**
 * Traditional CIP→SOC→Skills extraction (existing logic)
 */
async function extractTraditional(programId: string): Promise<ExtractionResult> {
  try {
    // Step 1: Get program and its CIP code
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name, cip_code')
      .eq('id', programId)
      .single()

    if (programError || !program) {
      return {
        programId,
        programName: 'Unknown',
        cipCode: '',
        socCodes: [],
        allSkills: [],
        topSkills: [],
        success: false,
        method: 'traditional',
        error: 'Program not found'
      }
    }

    // Step 2: Find SOC codes for this CIP
    const { data: crosswalk, error: crosswalkError } = await supabase
      .from('cip_soc_crosswalk')
      .select('soc_code, relevance_weight')
      .eq('cip_code', program.cip_code)

    if (crosswalkError || !crosswalk?.length) {
      return {
        programId,
        programName: program.name,
        cipCode: program.cip_code || '',
        socCodes: [],
        allSkills: [],
        topSkills: [],
        success: false,
        method: 'traditional',
        error: 'No SOC codes found for CIP code'
      }
    }

    const socCodes = crosswalk.map(c => c.soc_code)

    // Step 3: Get skills from SOC codes
    const { data: jobSkills, error: skillsError } = await supabase
      .from('job_skills')
      .select(`
        skill_id,
        importance_level,
        proficiency_threshold,
        weight,
        skills:skill_id (
          id,
          name,
          onet_importance
        )
      `)
      .in('job_id', crosswalk.map(c => c.job_id)) // Assuming you have job_id in crosswalk

    if (skillsError) {
      return {
        programId,
        programName: program.name,
        cipCode: program.cip_code || '',
        socCodes,
        allSkills: [],
        topSkills: [],
        success: false,
        method: 'traditional',
        error: `Skills query failed: ${skillsError.message}`
      }
    }

    // Step 4: Aggregate skills
    const skillMap = new Map<string, SkillWithWeight>()

    for (const js of jobSkills || []) {
      const skill = js.skills as any
      if (!skill) continue

      const skillName = skill.name
      const key = skillName.toLowerCase()

      const existing = skillMap.get(key) || {
        skill_id: skill.id,
        skill_name: skillName,
        weight: 0,
        frequency: 0,
        importance: 0,
        source: 'traditional'
      }

      existing.weight = Math.max(existing.weight, js.weight || 0)
      existing.frequency += 1
      existing.importance = Math.max(existing.importance, skill.onet_importance || 3.0)

      skillMap.set(key, existing)
    }

    const allSkills = Array.from(skillMap.values())
    const topSkills = allSkills
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15)

    return {
      programId,
      programName: program.name,
      cipCode: program.cip_code || '',
      socCodes,
      allSkills,
      topSkills,
      success: true,
      method: 'traditional'
    }

  } catch (error) {
    console.error('Traditional extraction failed:', error)
    return {
      programId,
      programName: 'Unknown',
      cipCode: '',
      socCodes: [],
      allSkills: [],
      topSkills: [],
      success: false,
      method: 'traditional',
      error: error.message
    }
  }
}

export default {
  extractSkillsForProgramEnhanced,
  extractWithLaiser,
  extractTraditional
}
