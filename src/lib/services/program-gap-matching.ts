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
 * Step 2: Find programs that teach gap skills
 */
export async function findProgramsForGaps(
  gaps: SkillGap[],
  options: {
    minMatchThreshold?: number
    maxResults?: number
    preferredModality?: string
    maxCost?: number
  } = {}
): Promise<ProgramMatch[]> {
  
  const {
    minMatchThreshold = 60,
    maxResults = 10,
    preferredModality,
    maxCost
  } = options
  
  console.log(`\n🔍 Finding programs for ${gaps.length} skill gaps`)
  console.log(`  Min match threshold: ${minMatchThreshold}%`)
  
  if (gaps.length === 0) {
    return []
  }
  
  // Get gap skill IDs
  const gapSkillIds = gaps.map(g => g.skill_id)
  
  // Find programs that teach these skills
  const { data: programSkills } = await supabase
    .from('program_skills')
    .select(`
      program_id,
      skill_id,
      weight,
      programs (
        id,
        name,
        cip_code,
        modality,
        duration_weeks,
        cost_usd,
        location,
        providers (
          name,
          logo_url
        )
      )
    `)
    .in('skill_id', gapSkillIds)
  
  if (!programSkills || programSkills.length === 0) {
    console.log('  ⚠️  No programs found teaching these skills')
    return []
  }
  
  // Group by program
  const programMap = new Map<string, {
    program: any
    skills: Array<{ skill_id: string; weight: number }>
  }>()
  
  for (const ps of programSkills) {
    if (!programMap.has(ps.program_id)) {
      programMap.set(ps.program_id, {
        program: ps.programs,
        skills: []
      })
    }
    programMap.get(ps.program_id)!.skills.push({
      skill_id: ps.skill_id,
      weight: ps.weight
    })
  }
  
  console.log(`  Found ${programMap.size} programs with matching skills`)
  
  // Calculate match scores
  const matches: ProgramMatch[] = []
  
  for (const [programId, data] of programMap) {
    const program = data.program
    
    // Filter by preferences
    if (preferredModality && program.modality !== preferredModality) continue
    if (maxCost && program.cost_usd && program.cost_usd > maxCost) continue
    
    const skillsCovered = data.skills.map(s => s.skill_id)
    const skillsNotCovered = gapSkillIds.filter(id => !skillsCovered.includes(id))
    const coveragePct = (skillsCovered.length / gapSkillIds.length) * 100
    
    // Calculate weighted match score
    let weightedScore = 0
    let totalWeight = 0
    
    const coveredGaps = []
    
    for (const gap of gaps) {
      // Weight by importance
      const importanceWeight = gap.importance === 'critical' ? 3 :
                              gap.importance === 'important' ? 2 : 1
      
      // Weight by gap size (larger gaps more important)
      const gapWeight = gap.gap / 100
      
      const combinedWeight = importanceWeight * (1 + gapWeight)
      totalWeight += combinedWeight
      
      if (skillsCovered.includes(gap.skill_id)) {
        weightedScore += combinedWeight
        coveredGaps.push({
          skill_id: gap.skill_id,
          skill_name: gap.skill_name,
          gap: gap.gap
        })
      }
    }
    
    const matchScore = (weightedScore / totalWeight) * 100
    
    // Only include if meets threshold
    if (matchScore >= minMatchThreshold) {
      matches.push({
        program_id: programId,
        program_name: program.name,
        provider_name: program.providers?.name || 'Unknown',
        provider_logo_url: program.providers?.logo_url,
        cip_code: program.cip_code,
        match_score: Math.round(matchScore),
        skills_covered: coveredGaps,
        skills_not_covered: skillsNotCovered,
        coverage_pct: Math.round(coveragePct),
        program_details: {
          modality: program.modality,
          duration_weeks: program.duration_weeks,
          cost_usd: program.cost_usd,
          location: program.location
        }
      })
    }
  }
  
  // Sort by match score
  matches.sort((a, b) => b.match_score - a.match_score)
  
  console.log(`  ${matches.length} programs meet ${minMatchThreshold}% threshold`)
  
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
