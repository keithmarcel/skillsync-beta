// Lightcast Open Skills + O*NET Hybrid Integration
// Combines industry-standard skills taxonomy with government validation

interface LightcastSkill {
  id: string
  name: string
  description: string
  type: {
    id: number
    name: string
  }
  occupations?: Array<{
    id: string
    name: string
  }>
  industries?: Array<{
    id: string
    name: string
  }>
  tags?: string[]
  infoUrl?: string
}

export interface SkillRelevanceScore {
  skill: LightcastSkill
  relevanceScore: number
  onetValidation: boolean
  marketDemand: 'low' | 'moderate' | 'high' | 'critical'
  aiReasoning: string
  recommendedForAssessment: boolean
}

interface SkillCurationData {
  socCode: string
  allSkills: SkillRelevanceScore[]
  aiRecommendations: SkillRelevanceScore[]
  adminSelected: string[]
  lastUpdated: string
  validatedBy: string
}

/**
 * Fetch all Lightcast Open Skills data
 */
export async function fetchLightcastSkillsData(): Promise<LightcastSkill[]> {
  try {
    const response = await fetch(
      'https://github.com/lightcast-dev/Open-Skills/raw/main/open_skills.json',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SkillSync-Assessment-Platform/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Lightcast API error: ${response.status}`)
    }

    const skills = await response.json()
    console.log(`Loaded ${skills.length} Lightcast skills`)
    return skills

  } catch (error) {
    console.error('Failed to fetch Lightcast skills:', error)
    throw new Error('Unable to load Lightcast skills data')
  }
}

/**
 * Filter Lightcast skills by SOC code relevance
 * Uses skills already in database instead of fetching from GitHub
 */
export async function getSkillsBySocCode(
  socCode: string,
  maxResults: number = 30
): Promise<LightcastSkill[]> {
  
  // Use database skills instead of fetching from GitHub
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: dbSkills } = await supabase
    .from('skills')
    .select('id, name, description, category')
    .eq('source', 'LIGHTCAST')
    .limit(1000) // Get a large sample
  
  if (!dbSkills || dbSkills.length === 0) {
    console.warn('No Lightcast skills in database, falling back to GitHub')
    const allSkills = await fetchLightcastSkillsData()
    return filterSkillsBySoc(allSkills, socCode, maxResults)
  }
  
  // Convert database skills to LightcastSkill format
  const allSkills: LightcastSkill[] = dbSkills.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description || '',
    type: { name: s.category || 'General', id: s.category || 'general' },
    infoUrl: '',
    tags: []
  }))
  
  return filterSkillsBySoc(allSkills, socCode, maxResults)
}

function filterSkillsBySoc(
  allSkills: LightcastSkill[],
  socCode: string,
  maxResults: number
): LightcastSkill[] {
  
  // Filter skills relevant to SOC code
  const relevantSkills = allSkills.filter(skill => {
    // Direct SOC code match
    if (skill.occupations?.some(occ => occ.id.includes(socCode))) {
      return true
    }

    // Industry relevance based on SOC code patterns
    const socPrefix = socCode.substring(0, 2)
    const industryMappings = {
      '11': ['management', 'executive', 'leadership'],
      '13': ['business', 'finance', 'accounting'],
      '15': ['computer', 'software', 'technology', 'IT'],
      '17': ['engineering', 'architecture', 'technical'],
      '25': ['education', 'training', 'instruction'],
      '29': ['healthcare', 'medical', 'clinical'],
      '41': ['sales', 'retail', 'customer'],
      '43': ['office', 'administrative', 'clerical']
    }

    const relevantIndustries = industryMappings[socPrefix as keyof typeof industryMappings] || []
    
    return skill.industries?.some(industry => 
      relevantIndustries.some(keyword => 
        industry.name.toLowerCase().includes(keyword)
      )
    ) || skill.tags?.some(tag =>
      relevantIndustries.some(keyword =>
        tag.toLowerCase().includes(keyword)
      )
    )
  })

  // Sort by skill type priority (technical skills first)
  const prioritizedSkills = relevantSkills.sort((a, b) => {
    const technicalTypes = ['Hard Skill', 'Software', 'Technology', 'Certification']
    const aIsTechnical = technicalTypes.includes(a.type.name)
    const bIsTechnical = technicalTypes.includes(b.type.name)
    
    if (aIsTechnical && !bIsTechnical) return -1
    if (!aIsTechnical && bIsTechnical) return 1
    return 0
  })

  return prioritizedSkills.slice(0, maxResults)
}

/**
 * Validate Lightcast skills against O*NET data
 */
export async function validateSkillsWithONET(
  lightcastSkills: LightcastSkill[],
  socCode: string
): Promise<SkillRelevanceScore[]> {
  
  // TODO: Integrate with existing O*NET service
  // For now, simulate validation based on skill characteristics
  
  return lightcastSkills.map(skill => {
    // Simple validation logic - enhance with actual O*NET cross-reference
    const isValidated = !isGenericSkill(skill.name) && isTechnicalSkill(skill)
    const marketDemand = calculateMarketDemand(skill, socCode)
    
    return {
      skill,
      relevanceScore: calculateRelevanceScore(skill, socCode),
      onetValidation: isValidated,
      marketDemand,
      aiReasoning: generateAIReasoning(skill, socCode, isValidated),
      recommendedForAssessment: isValidated && marketDemand !== 'low'
    }
  })
}

/**
 * AI-powered skill relevance analysis
 */
export async function analyzeSkillRelevance(
  skills: SkillRelevanceScore[],
  jobDescription?: string,
  companyContext?: string
): Promise<SkillRelevanceScore[]> {
  
  // Enhanced AI analysis would go here
  // For now, use rule-based scoring
  
  return skills.map(skillScore => {
    let enhancedScore = skillScore.relevanceScore
    
    // Boost score for job description matches
    if (jobDescription && skillScore.skill.name.toLowerCase().includes(jobDescription.toLowerCase())) {
      enhancedScore += 20
    }
    
    // Boost score for technical skills
    if (isTechnicalSkill(skillScore.skill)) {
      enhancedScore += 15
    }
    
    // Reduce score for generic skills
    if (isGenericSkill(skillScore.skill.name)) {
      enhancedScore -= 25
    }
    
    return {
      ...skillScore,
      relevanceScore: Math.min(100, Math.max(0, enhancedScore)),
      aiReasoning: enhanceAIReasoning(skillScore, jobDescription, companyContext)
    }
  }).sort((a, b) => b.relevanceScore - a.relevanceScore)
}

/**
 * Helper functions
 */
function isGenericSkill(skillName: string): boolean {
  const genericSkills = [
    'communication', 'teamwork', 'leadership', 'problem solving',
    'time management', 'customer service', 'microsoft office',
    'email', 'phone', 'writing', 'reading', 'speaking'
  ]
  
  return genericSkills.some(generic => 
    skillName.toLowerCase().includes(generic)
  )
}

function isTechnicalSkill(skill: LightcastSkill): boolean {
  const technicalTypes = ['Hard Skill', 'Software', 'Technology', 'Certification']
  const technicalKeywords = [
    'programming', 'software', 'database', 'analysis', 'modeling',
    'engineering', 'technical', 'system', 'platform', 'framework'
  ]
  
  return technicalTypes.includes(skill.type.name) ||
         technicalKeywords.some(keyword => 
           skill.name.toLowerCase().includes(keyword) ||
           skill.description?.toLowerCase().includes(keyword)
         )
}

function calculateMarketDemand(skill: LightcastSkill, socCode: string): 'low' | 'moderate' | 'high' | 'critical' {
  // Simulate market demand based on SOC patterns and skill type
  const socPrefix = socCode.substring(0, 2)
  const highDemandSocs = ['11', '13', '15', '17', '29'] // Management, Business, Tech, Engineering, Healthcare
  
  if (highDemandSocs.includes(socPrefix) && isTechnicalSkill(skill)) {
    return 'high'
  }
  
  if (isTechnicalSkill(skill)) {
    return 'moderate'
  }
  
  return 'low'
}

function calculateRelevanceScore(skill: LightcastSkill, socCode: string): number {
  let score = 50 // Base score
  
  // SOC code direct match
  if (skill.occupations?.some(occ => occ.id.includes(socCode))) {
    score += 30
  }
  
  // Technical skill bonus
  if (isTechnicalSkill(skill)) {
    score += 20
  }
  
  // Generic skill penalty
  if (isGenericSkill(skill.name)) {
    score -= 30
  }
  
  return Math.min(100, Math.max(0, score))
}

function generateAIReasoning(
  skill: LightcastSkill, 
  socCode: string, 
  isValidated: boolean
): string {
  if (!isValidated) {
    return `Generic skill - not suitable for technical assessment`
  }
  
  if (isTechnicalSkill(skill)) {
    return `Technical skill relevant to ${socCode} - good for differentiation`
  }
  
  return `Professional skill with moderate assessment value`
}

function enhanceAIReasoning(
  skillScore: SkillRelevanceScore,
  jobDescription?: string,
  companyContext?: string
): string {
  let reasoning = skillScore.aiReasoning
  
  if (jobDescription && skillScore.skill.name.toLowerCase().includes(jobDescription.toLowerCase())) {
    reasoning += ` - Matches job description requirements`
  }
  
  if (skillScore.marketDemand === 'high' || skillScore.marketDemand === 'critical') {
    reasoning += ` - High market demand`
  }
  
  return reasoning
}

/**
 * Save curated skills for SOC code
 */
export async function saveCuratedSkills(
  socCode: string,
  selectedSkillIds: string[],
  adminUserId: string
): Promise<void> {
  // TODO: Implement database save
  // This would create/update a soc_curated_skills table
  
  console.log('Saving curated skills:', {
    socCode,
    selectedSkillIds,
    adminUserId,
    timestamp: new Date().toISOString()
  })
}

/**
 * Get curated skills for SOC code
 */
export async function getCuratedSkills(socCode: string): Promise<string[]> {
  // TODO: Implement database retrieval
  // Return saved skill IDs for this SOC code
  
  return [] // Placeholder
}
