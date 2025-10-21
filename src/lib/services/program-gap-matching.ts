/**
 * Program Gap Matching Service
 * 
 * Matches programs to user skill gaps after assessment:
 * 1. Calculate skill gaps from assessment results
 * 2. Find programs that teach those skills
 * 3. Rank by match quality (60%+ threshold)
 * 4. Return top recommendations
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SkillGap {
  skill_id: string
  skill_name: string
  skill_category: string
  required_level: number // 0-100
  user_level: number // 0-100
  gap: number // required - user
  importance: 'critical' | 'important' | 'helpful'
}

export interface ProgramMatch {
  program_id: string
  program_name: string
  provider_name: string
  provider_logo_url: string | null
  cip_code: string
  match_score: number // 0-100
  skills_covered: Array<{
    skill_id: string
    skill_name: string
    gap: number
  }>
  skills_not_covered: string[]
  coverage_pct: number
  program_details: {
    modality: string
    duration_weeks: number
    cost_usd: number | null
    location: string | null
  }
}

/**
 * Step 1: Calculate skill gaps from assessment
 */
export async function calculateSkillGaps(
  assessmentId: string
): Promise<SkillGap[]> {
  
  console.log(`\n📊 Calculating skill gaps for assessment ${assessmentId}`)
  
  // Get assessment with job info
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*, job:jobs(id, soc_code, title)')
    .eq('id', assessmentId)
    .single()
  
  if (!assessment) {
    throw new Error('Assessment not found')
  }
  
  // Get required skills for job
  const { data: requiredSkills } = await supabase
    .from('job_skills')
    .select('*, skills(*)')
    .eq('job_id', assessment.job.id)
  
  // Get user's skill results
  const { data: userSkills } = await supabase
    .from('assessment_skill_results')
    .select('*')
    .eq('assessment_id', assessmentId)
  
  const gaps: SkillGap[] = []
  
  for (const required of requiredSkills || []) {
    const userResult = userSkills?.find(us => us.skill_id === required.skill_id)
    const userLevel = userResult?.score_pct || 0
    const requiredLevel = required.proficiency_threshold || 70
    
    // Only include if user is below required level
    if (userLevel < requiredLevel) {
      gaps.push({
        skill_id: required.skill_id,
        skill_name: required.skills.name,
        skill_category: required.skills.category,
        required_level: requiredLevel,
        user_level: userLevel,
        gap: requiredLevel - userLevel,
        importance: required.importance_level
      })
    }
  }
  
  // Sort by importance then gap size
  gaps.sort((a, b) => {
    const importanceOrder = { critical: 0, important: 1, helpful: 2 }
    if (a.importance !== b.importance) {
      return importanceOrder[a.importance] - importanceOrder[b.importance]
    }
    return b.gap - a.gap
  })
  
  console.log(`  Found ${gaps.length} skill gaps`)
  
  return gaps
}

/**
 * Step 2: Find programs via CIP-SOC crosswalk
 * NOTE: Using crosswalk instead of skill matching due to skill ID mismatches
 * between job_skills and program_skills tables
 */
export async function findProgramsForGaps(
  gaps: SkillGap[],
  options: {
    minMatchThreshold?: number
    maxResults?: number
    preferredModality?: string
    maxCost?: number
    jobSocCode?: string // NEW: Pass SOC code for crosswalk matching
  } = {}
): Promise<ProgramMatch[]> {
  
  const {
    minMatchThreshold = 60,
    maxResults = 10,
    preferredModality,
    maxCost,
    jobSocCode
  } = options
  
  console.log(`\n🔍 Finding programs via CIP-SOC crosswalk`)
  console.log(`  SOC Code: ${jobSocCode}`)
  console.log(`  Skill gaps: ${gaps.length}`)
  
  if (!jobSocCode) {
    console.log('  ⚠️  No SOC code provided, cannot match programs')
    return []
  }
  
  // Use CIP-SOC crosswalk to find programs
  const { data: cipMatches } = await supabase
    .from('cip_soc_crosswalk')
    .select('cip_code, match_strength')
    .eq('soc_code', jobSocCode)
  
  if (!cipMatches || cipMatches.length === 0) {
    console.log('  ⚠️  No CIP codes found for this SOC code')
    return []
  }
  
  const cipCodes = cipMatches.map(m => m.cip_code)
  console.log(`  Found ${cipCodes.length} matching CIP codes`)
  
  // Get programs with matching CIP codes
  const { data: programs } = await supabase
    .from('programs')
    .select(`
      id,
      name,
      cip_code,
      format,
      duration_text,
      school:schools(name, logo_url)
    `)
    .in('cip_code', cipCodes)
    .eq('status', 'published')
  
  if (!programs || programs.length === 0) {
    console.log('  ⚠️  No programs found for these CIP codes')
    return []
  }
  
  console.log(`  Found ${programs.length} programs via crosswalk`)
  
  // Create simplified matches based on CIP-SOC crosswalk strength
  const cipStrengthMap = new Map(cipMatches.map(m => [m.cip_code, m.match_strength]))
  
  const matches: ProgramMatch[] = programs.map((program: any) => {
    // Calculate match score based on crosswalk strength
    const matchStrength = cipStrengthMap.get(program.cip_code) || 'tertiary'
    const baseScore = matchStrength === 'primary' ? 90 :
                     matchStrength === 'secondary' ? 75 : 60
    
    return {
      program_id: program.id,
      program_name: program.name,
      provider_name: program.school?.name || 'Unknown',
      provider_logo_url: program.school?.logo_url || null,
      cip_code: program.cip_code,
      match_score: baseScore,
      skills_covered: gaps.map(g => ({
        skill_id: g.skill_id,
        skill_name: g.skill_name,
        gap: g.gap
      })),
      skills_not_covered: [],
      coverage_pct: 100, // Assume full coverage via crosswalk
      program_details: {
        modality: program.format || 'Online',
        duration_weeks: 0, // Parse from duration_text if needed
        cost_usd: null,
        location: null
      }
    }
  })
  
  // Sort by match score (primary matches first)
  matches.sort((a, b) => b.match_score - a.match_score)
  
  console.log(`  Returning ${Math.min(matches.length, maxResults)} programs`)
  
  return matches.slice(0, maxResults)
}

/**
 * Step 3: Get program recommendations for assessment
 */
export async function getProgramRecommendations(
  assessmentId: string,
  options?: {
    minMatchThreshold?: number
    maxResults?: number
    preferredModality?: string
    maxCost?: number
  }
): Promise<{
  gaps: SkillGap[]
  programs: ProgramMatch[]
  summary: {
    total_gaps: number
    critical_gaps: number
    programs_found: number
    best_match_score: number
  }
}> {
  
  // Calculate gaps
  const gaps = await calculateSkillGaps(assessmentId)
  
  // Find matching programs
  const programs = await findProgramsForGaps(gaps, options)
  
  // Generate summary
  const summary = {
    total_gaps: gaps.length,
    critical_gaps: gaps.filter(g => g.importance === 'critical').length,
    programs_found: programs.length,
    best_match_score: programs.length > 0 ? programs[0].match_score : 0
  }
  
  return {
    gaps,
    programs,
    summary
  }
}

/**
 * Track when user clicks on a program recommendation
 */
export async function trackProgramRecommendation(
  assessmentId: string,
  programId: string,
  matchScore: number,
  skillsCovered: string[]
): Promise<void> {
  
  await supabase
    .from('program_recommendations')
    .insert({
      assessment_id: assessmentId,
      program_id: programId,
      match_score: matchScore,
      skills_covered: skillsCovered,
      user_clicked: false,
      user_enrolled: false
    })
}

/**
 * Record user interaction with recommendation
 */
export async function recordRecommendationClick(
  recommendationId: string
): Promise<void> {
  
  await supabase
    .from('program_recommendations')
    .update({ user_clicked: true })
    .eq('id', recommendationId)
}

/**
 * Record user enrollment
 */
export async function recordProgramEnrollment(
  recommendationId: string
): Promise<void> {
  
  await supabase
    .from('program_recommendations')
    .update({ user_enrolled: true })
    .eq('id', recommendationId)
}
