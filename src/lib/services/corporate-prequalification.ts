// Corporate Pre-qualification System
// Filters and ranks candidates based on assessment proficiency for admin dashboards

import { createClient } from '@supabase/supabase-js'
import { calculateRoleReadiness, type RoleReadinessScore, type QualifiedCandidate } from './assessment-engine'

// Use server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================================================
// INTERFACES
// ============================================================================

export interface PreQualificationFilter {
  // Company Requirements
  minimumProficiency: number       // 90% for featured roles
  requiredSkills: string[]         // Must-have skills
  preferredSkills: string[]        // Nice-to-have skills
  
  // Filtering Logic
  hardRequirements: {
    overallScore: number           // Minimum overall proficiency
    criticalSkills: Array<{        // Skills that cannot have gaps
      skillId: string
      minimumScore: number
    }>
  }
  
  softRequirements: {
    preferredScore: number         // Preferred overall proficiency
    bonusSkills: string[]          // Skills that add value
  }
}

export interface CandidateRanking {
  userId: string
  overallScore: number
  skillMatchScore: number
  experienceScore: number
  improvementTrendScore: number
  finalRankingScore: number
}

// ============================================================================
// MAIN PRE-QUALIFICATION FUNCTIONS
// ============================================================================

export async function getQualifiedCandidates(
  companyId: string,
  roleId: string,
  filters?: Partial<PreQualificationFilter>
): Promise<QualifiedCandidate[]> {
  
  try {
    // 1. Get role and company requirements
    const { data: role } = await supabase
      .from('featured_roles')
      .select(`
        *,
        company:companies(*),
        skill_requirements:role_skill_requirements(
          skill_id,
          importance,
          minimum_proficiency,
          skill:skills(*)
        )
      `)
      .eq('id', roleId)
      .single()

    if (!role) {
      throw new Error('Role not found')
    }

    // 2. Build default filters if not provided
    const defaultFilters: PreQualificationFilter = {
      minimumProficiency: role.proficiency_threshold || 75,
      requiredSkills: role.skill_requirements
        ?.filter((req: any) => req.importance >= 4.0)
        ?.map((req: any) => req.skill_id) || [],
      preferredSkills: role.skill_requirements
        ?.filter((req: any) => req.importance >= 3.0 && req.importance < 4.0)
        ?.map((req: any) => req.skill_id) || [],
      hardRequirements: {
        overallScore: role.proficiency_threshold || 75,
        criticalSkills: role.skill_requirements
          ?.filter((req: any) => req.importance >= 4.5)
          ?.map((req: any) => ({
            skillId: req.skill_id,
            minimumScore: req.minimum_proficiency || 80
          })) || []
      },
      softRequirements: {
        preferredScore: (role.proficiency_threshold || 75) + 10,
        bonusSkills: role.skill_requirements
          ?.filter((req: any) => req.importance >= 3.5)
          ?.map((req: any) => req.skill_id) || []
      }
    }

    const finalFilters = { ...defaultFilters, ...filters }

    // 3. Get all candidates who have taken assessments for this role/SOC
    const { data: assessmentResults } = await supabase
      .from('role_readiness_scores')
      .select(`
        *,
        user:users(
          id,
          email,
          profile:user_profiles(
            first_name,
            last_name,
            location,
            experience_level
          )
        )
      `)
      .eq('role_id', roleId)
      .gte('overall_proficiency', finalFilters.hardRequirements.overallScore)
      .gt('expires_at', new Date().toISOString())
      .order('overall_proficiency', { ascending: false })

    if (!assessmentResults || assessmentResults.length === 0) {
      return []
    }

    // 4. Apply hard requirements filter and build qualified candidates
    const qualifiedCandidates: QualifiedCandidate[] = []

    for (const result of assessmentResults) {
      // Check hard requirements
      const meetsHardRequirements = await checkHardRequirements(
        result.user_id,
        roleId,
        finalFilters.hardRequirements
      )

      if (!meetsHardRequirements) continue

      // Check soft requirements
      const meetsSoftRequirements = await checkSoftRequirements(
        result.user_id,
        roleId,
        finalFilters.softRequirements
      )

      // Calculate skill matching scores
      const skillMatch = await calculateSkillMatch(
        result.user_id,
        roleId,
        finalFilters.requiredSkills,
        finalFilters.preferredSkills
      )

      // Calculate ranking score
      const rankingScore = calculateRankingScore(
        result.overall_proficiency,
        skillMatch,
        meetsSoftRequirements,
        result.calculated_at
      )

      // Determine qualification level
      const qualificationLevel = getQualificationLevel(
        result.overall_proficiency,
        meetsHardRequirements,
        meetsSoftRequirements
      )

      // Get improvement trend
      const improvementTrend = await calculateImprovementTrend(result.user_id, roleId)

      qualifiedCandidates.push({
        userId: result.user_id,
        userProfile: {
          name: `${result.user?.profile?.first_name || ''} ${result.user?.profile?.last_name || ''}`.trim() || 'Anonymous',
          email: result.user?.email || '',
          location: result.user?.profile?.location
        },
        overallProficiency: result.overall_proficiency,
        roleReadiness: result.role_readiness,
        meetsHardRequirements,
        meetsSoftRequirements,
        qualificationLevel,
        skillMatch,
        rankingScore,
        lastAssessmentDate: result.calculated_at,
        improvementTrend
      })
    }

    // 5. Sort by ranking score and cache results
    const sortedCandidates = qualifiedCandidates.sort((a, b) => b.rankingScore - a.rankingScore)
    
    // Cache the results for performance
    await cachePrequalificationResults(companyId, roleId, sortedCandidates)

    return sortedCandidates

  } catch (error) {
    console.error('Failed to get qualified candidates:', error)
    throw error
  }
}

// ============================================================================
// REQUIREMENT CHECKING FUNCTIONS
// ============================================================================

async function checkHardRequirements(
  userId: string,
  roleId: string,
  hardRequirements: PreQualificationFilter['hardRequirements']
): Promise<boolean> {
  
  // Get user's skill scores for this role
  const { data: skillScores } = await supabase
    .from('assessment_results')
    .select('skill_id, weighted_score')
    .eq('user_id', userId)
    .in('skill_id', hardRequirements.criticalSkills.map(cs => cs.skillId))

  if (!skillScores) return false

  // Check each critical skill meets minimum score
  for (const criticalSkill of hardRequirements.criticalSkills) {
    const skillScore = skillScores.find(s => s.skill_id === criticalSkill.skillId)
    if (!skillScore || skillScore.weighted_score < criticalSkill.minimumScore) {
      return false
    }
  }

  return true
}

async function checkSoftRequirements(
  userId: string,
  roleId: string,
  softRequirements: PreQualificationFilter['softRequirements']
): Promise<boolean> {
  
  // Get overall proficiency
  const { data: roleReadiness } = await supabase
    .from('role_readiness_scores')
    .select('overall_proficiency')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .single()

  if (!roleReadiness) return false

  // Check if meets preferred score
  return roleReadiness.overall_proficiency >= softRequirements.preferredScore
}

// ============================================================================
// SKILL MATCHING FUNCTIONS
// ============================================================================

async function calculateSkillMatch(
  userId: string,
  roleId: string,
  requiredSkills: string[],
  preferredSkills: string[]
): Promise<QualifiedCandidate['skillMatch']> {
  
  // Get user's skill scores
  const { data: skillScores } = await supabase
    .from('assessment_results')
    .select('skill_id, weighted_score')
    .eq('user_id', userId)
    .in('skill_id', [...requiredSkills, ...preferredSkills])

  if (!skillScores) {
    return {
      requiredSkillsScore: 0,
      preferredSkillsScore: 0,
      standoutSkills: []
    }
  }

  // Calculate required skills average
  const requiredScores = skillScores.filter(s => requiredSkills.includes(s.skill_id))
  const requiredSkillsScore = requiredScores.length > 0 
    ? requiredScores.reduce((sum, s) => sum + s.weighted_score, 0) / requiredScores.length
    : 0

  // Calculate preferred skills average
  const preferredScores = skillScores.filter(s => preferredSkills.includes(s.skill_id))
  const preferredSkillsScore = preferredScores.length > 0
    ? preferredScores.reduce((sum, s) => sum + s.weighted_score, 0) / preferredScores.length
    : 0

  // Find standout skills (95%+)
  const standoutSkillIds = skillScores
    .filter(s => s.weighted_score >= 95)
    .map(s => s.skill_id)

  // Get skill names for standout skills
  const { data: skills } = await supabase
    .from('skills')
    .select('name')
    .in('id', standoutSkillIds)

  const standoutSkills = skills?.map(s => s.name) || []

  return {
    requiredSkillsScore,
    preferredSkillsScore,
    standoutSkills
  }
}

// ============================================================================
// RANKING AND SCORING FUNCTIONS
// ============================================================================

function calculateRankingScore(
  overallProficiency: number,
  skillMatch: QualifiedCandidate['skillMatch'],
  meetsSoftRequirements: boolean,
  lastAssessmentDate: string
): number {
  
  // Base score from overall proficiency (40% weight)
  const proficiencyScore = overallProficiency * 0.4

  // Skill matching score (35% weight)
  const skillMatchScore = (
    (skillMatch.requiredSkillsScore * 0.7) + 
    (skillMatch.preferredSkillsScore * 0.2) +
    (skillMatch.standoutSkills.length * 5) // Bonus for standout skills
  ) * 0.35

  // Soft requirements bonus (15% weight)
  const softRequirementsScore = meetsSoftRequirements ? 15 : 0

  // Recency bonus (10% weight) - more recent assessments get higher scores
  const daysSinceAssessment = Math.floor(
    (Date.now() - new Date(lastAssessmentDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  const recencyScore = Math.max(0, 10 - (daysSinceAssessment * 0.1))

  return Math.min(100, proficiencyScore + skillMatchScore + softRequirementsScore + recencyScore)
}

function getQualificationLevel(
  overallProficiency: number,
  meetsHardRequirements: boolean,
  meetsSoftRequirements: boolean
): 'Highly Qualified' | 'Qualified' | 'Developing' {
  
  if (overallProficiency >= 90 && meetsHardRequirements && meetsSoftRequirements) {
    return 'Highly Qualified'
  }
  
  if (overallProficiency >= 75 && meetsHardRequirements) {
    return 'Qualified'
  }
  
  return 'Developing'
}

async function calculateImprovementTrend(
  userId: string,
  roleId: string
): Promise<'Improving' | 'Stable' | 'Declining'> {
  
  // Get last 3 assessment results for trend analysis
  const { data: recentScores } = await supabase
    .from('role_readiness_scores')
    .select('overall_proficiency, calculated_at')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .order('calculated_at', { ascending: false })
    .limit(3)

  if (!recentScores || recentScores.length < 2) {
    return 'Stable'
  }

  // Calculate trend
  const latest = recentScores[0].overall_proficiency
  const previous = recentScores[1].overall_proficiency
  const difference = latest - previous

  if (difference > 5) return 'Improving'
  if (difference < -5) return 'Declining'
  return 'Stable'
}

// ============================================================================
// CACHING FUNCTIONS
// ============================================================================

async function cachePrequalificationResults(
  companyId: string,
  roleId: string,
  candidates: QualifiedCandidate[]
): Promise<void> {
  
  try {
    // Clear existing cache
    await supabase
      .from('prequalification_cache')
      .delete()
      .eq('company_id', companyId)
      .eq('role_id', roleId)

    // Insert new cache entries
    const cacheEntries = candidates.map(candidate => ({
      company_id: companyId,
      role_id: roleId,
      user_id: candidate.userId,
      meets_requirements: candidate.meetsHardRequirements,
      qualification_level: candidate.qualificationLevel,
      ranking_score: candidate.rankingScore,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }))

    await supabase
      .from('prequalification_cache')
      .insert(cacheEntries)

  } catch (error) {
    console.error('Failed to cache prequalification results:', error)
    // Non-critical error, don't throw
  }
}

// ============================================================================
// ADMIN DASHBOARD FUNCTIONS
// ============================================================================

export async function getCachedQualifiedCandidates(
  companyId: string,
  roleId: string
): Promise<QualifiedCandidate[] | null> {
  
  try {
    const { data: cachedResults } = await supabase
      .from('prequalification_cache')
      .select(`
        *,
        user:users(
          id,
          email,
          profile:user_profiles(
            first_name,
            last_name,
            location
          )
        ),
        role_readiness:role_readiness_scores!inner(
          overall_proficiency,
          role_readiness,
          calculated_at
        )
      `)
      .eq('company_id', companyId)
      .eq('role_id', roleId)
      .gt('expires_at', new Date().toISOString())
      .order('ranking_score', { ascending: false })

    if (!cachedResults || cachedResults.length === 0) {
      return null
    }

    // Transform cached results back to QualifiedCandidate format
    return cachedResults.map(cached => ({
      userId: cached.user_id,
      userProfile: {
        name: `${cached.user?.profile?.first_name || ''} ${cached.user?.profile?.last_name || ''}`.trim() || 'Anonymous',
        email: cached.user?.email || '',
        location: cached.user?.profile?.location
      },
      overallProficiency: cached.role_readiness?.overall_proficiency || 0,
      roleReadiness: cached.role_readiness?.role_readiness || 'Not Ready',
      meetsHardRequirements: cached.meets_requirements,
      meetsSoftRequirements: cached.qualification_level === 'Highly Qualified',
      qualificationLevel: cached.qualification_level,
      skillMatch: {
        requiredSkillsScore: 0, // Would need to recalculate or cache separately
        preferredSkillsScore: 0,
        standoutSkills: []
      },
      rankingScore: cached.ranking_score,
      lastAssessmentDate: cached.role_readiness?.calculated_at || cached.cached_at,
      improvementTrend: 'Stable' as const // Would need to recalculate
    }))

  } catch (error) {
    console.error('Failed to get cached candidates:', error)
    return null
  }
}

export async function refreshPrequalificationCache(
  companyId: string,
  roleId: string
): Promise<QualifiedCandidate[]> {
  
  // Force refresh by calling main function
  return await getQualifiedCandidates(companyId, roleId)
}

export default {
  getQualifiedCandidates,
  getCachedQualifiedCandidates,
  refreshPrequalificationCache
}
