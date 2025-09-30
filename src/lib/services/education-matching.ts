// Education Matching Algorithm - Precision Program Recommendations
// Matches skill gaps to education programs with surgical precision

import { createClient } from '@supabase/supabase-js'
import { type RoleReadinessScore, type SkillProficiency } from './assessment-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================================================
// INTERFACES
// ============================================================================

export interface SkillGap {
  skillName: string
  skillId: string
  currentLevel: number
  targetLevel: number
  gapSize: number
  priority: 'Critical' | 'Important' | 'Helpful'
  marketDemand: 'High' | 'Medium' | 'Low'
}

export interface EducationProgram {
  id: string
  name: string
  provider: string
  description: string
  duration: string
  format: 'Online' | 'Hybrid' | 'In-person'
  cost: number
  startDate: string
  skills: string[]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  outcomes: string[]
}

export interface ProgramRecommendation {
  program: EducationProgram
  gapCoverage: number            // % of gaps this program addresses
  skillAlignment: number         // How well skills align (0-100%)
  difficultyMatch: number        // Appropriate for current level
  expectedImprovement: number    // Predicted proficiency increase
  timeToRoleReady: string        // "After completion, you'll be role-ready"
  overallMatch: number           // Combined match score
}

export interface EducationRecommendation {
  identifiedGaps: SkillGap[]
  recommendedPrograms: ProgramRecommendation[]
  recommendedSequence: Array<{
    order: number
    programId: string
    reasoning: string
    prerequisites: string[]
  }>
  estimatedTimeline: string
  totalCost: number
}

// ============================================================================
// MAIN MATCHING FUNCTION
// ============================================================================

export async function generateEducationRecommendations(
  userId: string,
  roleId: string,
  roleReadiness: RoleReadinessScore
): Promise<EducationRecommendation> {
  
  try {
    // 1. Identify and prioritize skill gaps
    const identifiedGaps = await identifySkillGaps(roleReadiness.skillProficiencies)
    
    // 2. Get available education programs
    const availablePrograms = await getAvailablePrograms(identifiedGaps)
    
    // 3. Match programs to gaps with precision scoring
    const programMatches = await matchProgramsToGaps(identifiedGaps, availablePrograms)
    
    // 4. Generate optimal learning sequence
    const recommendedSequence = generateLearningSequence(programMatches, identifiedGaps)
    
    // 5. Calculate timeline and cost
    const estimatedTimeline = calculateTimeline(recommendedSequence, programMatches)
    const totalCost = calculateTotalCost(recommendedSequence, programMatches)
    
    // 6. Save recommendations for tracking
    await saveRecommendations(userId, roleId, {
      identifiedGaps,
      recommendedPrograms: programMatches,
      recommendedSequence,
      estimatedTimeline,
      totalCost
    })
    
    return {
      identifiedGaps,
      recommendedPrograms: programMatches,
      recommendedSequence,
      estimatedTimeline,
      totalCost
    }
    
  } catch (error) {
    console.error('Failed to generate education recommendations:', error)
    throw error
  }
}

// ============================================================================
// GAP IDENTIFICATION
// ============================================================================

async function identifySkillGaps(skillProficiencies: SkillProficiency[]): Promise<SkillGap[]> {
  
  const gaps: SkillGap[] = []
  
  for (const skill of skillProficiencies) {
    if (skill.gap > 0) {
      // Get market demand for this skill
      const { data: skillData } = await supabase
        .from('skills')
        .select('market_demand, category')
        .eq('id', skill.skillId)
        .single()
      
      gaps.push({
        skillName: skill.skillName,
        skillId: skill.skillId,
        currentLevel: skill.currentLevel,
        targetLevel: skill.requiredLevel,
        gapSize: skill.gap,
        priority: getPriority(skill.importance, skill.gap),
        marketDemand: skillData?.market_demand || 'Medium'
      })
    }
  }
  
  // Sort by priority and gap size
  return gaps.sort((a, b) => {
    const priorityWeight = { 'Critical': 3, 'Important': 2, 'Helpful': 1 }
    return (priorityWeight[b.priority] * b.gapSize) - (priorityWeight[a.priority] * a.gapSize)
  })
}

function getPriority(importance: number, gapSize: number): 'Critical' | 'Important' | 'Helpful' {
  if (importance >= 4.0 && gapSize >= 20) return 'Critical'
  if (importance >= 3.0 && gapSize >= 15) return 'Important'
  return 'Helpful'
}

// ============================================================================
// PROGRAM MATCHING
// ============================================================================

async function getAvailablePrograms(gaps: SkillGap[]): Promise<EducationProgram[]> {
  
  const skillIds = gaps.map(g => g.skillId)
  
  const { data: programs } = await supabase
    .from('education_programs')
    .select(`
      *,
      program_skills:program_skill_mappings(
        skill_id,
        skill:skills(name)
      )
    `)
    .eq('status', 'active')
    .overlaps('skill_ids', skillIds)
  
  return programs?.map(p => ({
    id: p.id,
    name: p.name,
    provider: p.provider_name,
    description: p.description,
    duration: p.duration,
    format: p.format,
    cost: p.cost || 0,
    startDate: p.next_start_date,
    skills: p.program_skills?.map((ps: any) => ps.skill_id) || [],
    difficulty: p.difficulty_level,
    outcomes: p.learning_outcomes || []
  })) || []
}

async function matchProgramsToGaps(
  gaps: SkillGap[],
  programs: EducationProgram[]
): Promise<ProgramRecommendation[]> {
  
  const matches: ProgramRecommendation[] = []
  
  for (const program of programs) {
    // Calculate gap coverage
    const gapCoverage = calculateGapCoverage(program.skills, gaps)
    
    // Calculate skill alignment
    const skillAlignment = calculateSkillAlignment(program, gaps)
    
    // Calculate difficulty match
    const difficultyMatch = calculateDifficultyMatch(program, gaps)
    
    // Calculate expected improvement
    const expectedImprovement = calculateExpectedImprovement(program, gaps)
    
    // Calculate overall match score
    const overallMatch = (
      gapCoverage * 0.4 +
      skillAlignment * 0.3 +
      difficultyMatch * 0.2 +
      (expectedImprovement / 100) * 0.1
    )
    
    // Only include programs with good matches
    if (overallMatch >= 60) {
      matches.push({
        program,
        gapCoverage,
        skillAlignment,
        difficultyMatch,
        expectedImprovement,
        timeToRoleReady: calculateTimeToReady(program, gaps),
        overallMatch
      })
    }
  }
  
  // Sort by match quality and return top 5
  return matches
    .sort((a, b) => b.overallMatch - a.overallMatch)
    .slice(0, 5)
}

// ============================================================================
// MATCHING CALCULATIONS
// ============================================================================

function calculateGapCoverage(programSkills: string[], gaps: SkillGap[]): number {
  const coveredGaps = gaps.filter(gap => programSkills.includes(gap.skillId))
  return gaps.length > 0 ? (coveredGaps.length / gaps.length) * 100 : 0
}

function calculateSkillAlignment(program: EducationProgram, gaps: SkillGap[]): number {
  const criticalGaps = gaps.filter(g => g.priority === 'Critical')
  const programCoversCritical = criticalGaps.filter(gap => 
    program.skills.includes(gap.skillId)
  ).length
  
  const criticalCoverage = criticalGaps.length > 0 
    ? (programCoversCritical / criticalGaps.length) * 100 
    : 100
  
  const totalCoverage = calculateGapCoverage(program.skills, gaps)
  
  return (criticalCoverage * 0.7) + (totalCoverage * 0.3)
}

function calculateDifficultyMatch(program: EducationProgram, gaps: SkillGap[]): number {
  const avgCurrentLevel = gaps.reduce((sum, gap) => sum + gap.currentLevel, 0) / gaps.length
  
  const difficultyScores = {
    'Beginner': avgCurrentLevel <= 40 ? 100 : Math.max(0, 100 - (avgCurrentLevel - 40) * 2),
    'Intermediate': avgCurrentLevel >= 30 && avgCurrentLevel <= 70 ? 100 : 
                   avgCurrentLevel < 30 ? 60 : Math.max(0, 100 - (avgCurrentLevel - 70) * 2),
    'Advanced': avgCurrentLevel >= 60 ? 100 : Math.max(0, (avgCurrentLevel - 20) * 1.25)
  }
  
  return difficultyScores[program.difficulty] || 50
}

function calculateExpectedImprovement(program: EducationProgram, gaps: SkillGap[]): number {
  const relevantGaps = gaps.filter(gap => program.skills.includes(gap.skillId))
  
  if (relevantGaps.length === 0) return 0
  
  const avgGapSize = relevantGaps.reduce((sum, gap) => sum + gap.gapSize, 0) / relevantGaps.length
  
  // Estimate improvement based on program quality and gap size
  const difficultyMultiplier = {
    'Beginner': 0.6,
    'Intermediate': 0.8,
    'Advanced': 0.9
  }[program.difficulty] || 0.7
  
  return Math.min(avgGapSize * difficultyMultiplier, 40) // Cap at 40% improvement
}

function calculateTimeToReady(program: EducationProgram, gaps: SkillGap[]): string {
  const criticalGaps = gaps.filter(g => g.priority === 'Critical').length
  const programCoversCritical = gaps.filter(g => 
    g.priority === 'Critical' && program.skills.includes(g.skillId)
  ).length
  
  if (criticalGaps === 0) return 'Role-ready upon completion'
  if (programCoversCritical === criticalGaps) return 'Role-ready upon completion'
  if (programCoversCritical > criticalGaps * 0.7) return 'Nearly role-ready upon completion'
  return 'Additional training needed after completion'
}

// ============================================================================
// LEARNING SEQUENCE GENERATION
// ============================================================================

function generateLearningSequence(
  matches: ProgramRecommendation[],
  gaps: SkillGap[]
): Array<{
  order: number
  programId: string
  reasoning: string
  prerequisites: string[]
}> {
  
  const sequence = []
  const criticalGaps = gaps.filter(g => g.priority === 'Critical')
  
  // Sort programs by how well they address critical gaps first
  const sortedMatches = [...matches].sort((a, b) => {
    const aCriticalCoverage = criticalGaps.filter(gap => 
      a.program.skills.includes(gap.skillId)
    ).length
    const bCriticalCoverage = criticalGaps.filter(gap => 
      b.program.skills.includes(gap.skillId)
    ).length
    
    return bCriticalCoverage - aCriticalCoverage
  })
  
  // Build sequence prioritizing critical gaps
  for (let i = 0; i < Math.min(3, sortedMatches.length); i++) {
    const match = sortedMatches[i]
    
    sequence.push({
      order: i + 1,
      programId: match.program.id,
      reasoning: i === 0 
        ? 'Addresses the most critical skill gaps for role readiness'
        : `Builds upon foundational skills from previous program${i === 1 ? '' : 's'}`,
      prerequisites: i === 0 ? [] : [sortedMatches[i-1].program.id]
    })
  }
  
  return sequence
}

// ============================================================================
// TIMELINE AND COST CALCULATIONS
// ============================================================================

function calculateTimeline(
  sequence: Array<{order: number, programId: string}>,
  matches: ProgramRecommendation[]
): string {
  
  let totalWeeks = 0
  
  for (const step of sequence) {
    const program = matches.find(m => m.program.id === step.programId)?.program
    if (program) {
      const weeks = parseDuration(program.duration)
      totalWeeks += weeks
    }
  }
  
  if (totalWeeks <= 8) return `${totalWeeks} weeks`
  if (totalWeeks <= 24) return `${Math.ceil(totalWeeks / 4)} months`
  return `${Math.ceil(totalWeeks / 12)} quarters`
}

function calculateTotalCost(
  sequence: Array<{order: number, programId: string}>,
  matches: ProgramRecommendation[]
): number {
  
  return sequence.reduce((total, step) => {
    const program = matches.find(m => m.program.id === step.programId)?.program
    return total + (program?.cost || 0)
  }, 0)
}

function parseDuration(duration: string): number {
  const weeks = duration.match(/(\d+)\s*weeks?/i)
  const months = duration.match(/(\d+)\s*months?/i)
  
  if (weeks) return parseInt(weeks[1])
  if (months) return parseInt(months[1]) * 4
  return 8 // Default fallback
}

// ============================================================================
// PERSISTENCE
// ============================================================================

async function saveRecommendations(
  userId: string,
  roleId: string,
  recommendations: EducationRecommendation
): Promise<void> {
  
  try {
    await supabase
      .from('education_recommendations')
      .upsert({
        user_id: userId,
        role_id: roleId,
        identified_gaps: recommendations.identifiedGaps,
        recommended_programs: recommendations.recommendedPrograms.map(r => r.program.id),
        learning_sequence: recommendations.recommendedSequence,
        estimated_timeline: recommendations.estimatedTimeline,
        total_cost: recommendations.totalCost,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString() // 3 months
      })
  } catch (error) {
    console.error('Failed to save education recommendations:', error)
  }
}

export default {
  generateEducationRecommendations,
  identifySkillGaps,
  matchProgramsToGaps
}
