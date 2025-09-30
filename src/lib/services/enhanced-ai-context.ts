// Enhanced AI Context Generation with O*NET Hybrid Approach
// Solves O*NET data lag and SOC granularity limitations

import { updateProgress } from '@/lib/utils/progress'

interface DifficultyScale {
  level: 'entry' | 'mid' | 'senior' | 'executive'
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert'
  marketDemand: 'low' | 'moderate' | 'high' | 'critical'
  roleScope: 'individual' | 'team' | 'department' | 'organization'
}

interface MarketIntelligence {
  currentDemand: string
  salaryRange: string
  trendDirection: 'rising' | 'stable' | 'declining'
  primaryIndustries: string[]
  emergingRequirements: string[]
  region: string
}

interface CompanyContext {
  roleLevel: string
  teamSize: string
  budgetSize: string
  industry: string
  regulatoryEnvironment: string
  performanceMetrics: string[]
  organizationValues: string[]
}

interface SkillWeighting {
  onetImportance: number        // 1-5 O*NET baseline
  marketAdjustment: number      // Real-time demand multiplier
  companyWeight: number         // Organization-specific importance
  finalWeight: number           // Calculated assessment weight
  difficultyLevel: string       // Dynamic difficulty assignment
  questionCount: number         // Questions allocated to this skill
  performanceCorrelation: number // Historical success rate
}

/**
 * Calculate dynamic difficulty based on multiple factors
 */
export function calculateDynamicDifficulty(
  onetImportance: number,
  marketDemand: string,
  roleLevel: string,
  companySize: string
): number {
  const baseScore = onetImportance * 20 // Convert 1-5 scale to 0-100

  const marketMultipliers = {
    low: 0.8,
    moderate: 1.0,
    high: 1.2,
    critical: 1.4
  }

  const roleMultipliers = {
    entry: 0.7,
    mid: 1.0,
    senior: 1.3,
    executive: 1.6
  }

  const sizeMultipliers = {
    startup: 1.1,    // Higher expectations in small teams
    small: 1.0,
    medium: 0.95,
    large: 0.9,      // More specialized roles
    enterprise: 0.85
  }

  const marketMult = marketMultipliers[marketDemand as keyof typeof marketMultipliers] || 1.0
  const roleMult = roleMultipliers[roleLevel as keyof typeof roleMultipliers] || 1.0
  const sizeMult = sizeMultipliers[companySize as keyof typeof sizeMultipliers] || 1.0

  return Math.min(100, Math.round(baseScore * marketMult * roleMult * sizeMult))
}

/**
 * Generate enhanced AI context using O*NET + real-time data hybrid
 */
export async function generateEnhancedAIContext(
  socCode: string,
  skillName: string,
  onetData: any,
  marketData: MarketIntelligence,
  companyData: CompanyContext,
  sessionId?: string
): Promise<string> {

  if (sessionId) {
    updateProgress(sessionId, {
      status: 'enhancing_context',
      step: 4,
      totalSteps: 6,
      message: 'Generating enhanced AI context with market intelligence...'
    })
  }

  // Calculate dynamic difficulty
  const difficultyScore = calculateDynamicDifficulty(
    onetData.importance || 3.0,
    marketData.currentDemand,
    companyData.roleLevel,
    'medium' // Default company size
  )

  const difficultyLevel = difficultyScore >= 80 ? 'expert' :
                         difficultyScore >= 60 ? 'advanced' :
                         difficultyScore >= 40 ? 'intermediate' : 'basic'

  const enhancedPrompt = `
LAYERED INTELLIGENCE ASSESSMENT GENERATION

AUTHORITATIVE FOUNDATION (O*NET ${socCode}):
- Skill: ${skillName} (Government Importance: ${onetData.importance}/5.0)
- Work Activities: ${onetData.workActivities?.slice(0, 3).join(', ') || 'Standard occupational tasks'}
- Knowledge Areas: ${onetData.knowledge?.slice(0, 3).join(', ') || 'Domain expertise required'}
- Education Level: ${onetData.jobZone?.education || 'Post-secondary education'}
- Experience Level: ${onetData.jobZone?.experience || 'Moderate experience'}

REAL-TIME MARKET INTELLIGENCE:
- Current Demand: ${marketData.currentDemand} (trending ${marketData.trendDirection})
- Salary Range: ${marketData.salaryRange} (${marketData.region})
- Industry Focus: ${marketData.primaryIndustries.slice(0, 3).join(', ')}
- Emerging Requirements: ${marketData.emergingRequirements.slice(0, 2).join(', ')}

COMPANY-SPECIFIC CONTEXT:
- Role Level: ${companyData.roleLevel} (${companyData.teamSize} team management)
- Industry: ${companyData.industry} (${companyData.regulatoryEnvironment})
- Success Metrics: ${companyData.performanceMetrics.slice(0, 2).join(', ')}
- Organization Values: ${companyData.organizationValues.slice(0, 2).join(', ')}

ASSESSMENT PRECISION REQUIREMENTS:
This assessment must achieve surgical precision in skills gap identification.

CRITICAL OUTCOMES:
1. EDUCATION MAPPING ACCURACY: Questions must reveal precise competency gaps so SkillSync can connect job seekers with the RIGHT programs. A misfire could send someone to an unhelpful program.

2. EMPLOYER CONFIDENCE: If someone shows proficient, organizations must have complete confidence they've been tested properly for real job performance.

3. REAL-WORLD APPLICATION: Test actual job performance capabilities, not theoretical knowledge. Focus on skills that differentiate qualified vs unqualified candidates.

DYNAMIC DIFFICULTY CALIBRATION:
- Calculated Difficulty: ${difficultyScore}/100 (${difficultyLevel} level)
- Question Complexity: Create scenarios that match ${companyData.roleLevel} responsibilities
- Performance Focus: Test ability to ${companyData.performanceMetrics[0] || 'deliver results'}
- Industry Context: ${companyData.industry} environment with ${companyData.regulatoryEnvironment}

UNIQUE ALGORITHM ELEMENTS:
- Government authority (O*NET) + Market reality (real-time data)
- Regional workforce priorities + Company-specific requirements  
- Dynamic difficulty scaling + Performance correlation tracking
- Skills gap precision + Education pathway accuracy

Generate ${difficultyLevel} level questions that create SkillSync's unique "Skills Gap Precision Engine" - the first assessment system that combines authoritative government data with real-time market intelligence for unprecedented accuracy in workforce development.

Question Format: Multiple choice, scenario-based, outcome-focused
Context: ${companyData.industry} industry, ${companyData.roleLevel} level
Validation: Must differentiate competent vs incompetent performance
Education Impact: Gaps identified must map to specific program recommendations
`

  return enhancedPrompt
}

/**
 * Calculate skill weighting for admin visibility
 */
export function calculateSkillWeighting(
  onetImportance: number,
  marketDemand: string,
  companyWeight: number,
  historicalPerformance: number = 0.75
): SkillWeighting {
  
  const marketMultipliers = {
    low: 0.8,
    moderate: 1.0, 
    high: 1.2,
    critical: 1.4
  }

  const marketAdjustment = marketMultipliers[marketDemand as keyof typeof marketMultipliers] || 1.0
  const finalWeight = Math.min(5.0, onetImportance * marketAdjustment * (companyWeight / 3.0))
  
  const difficultyLevel = finalWeight >= 4.0 ? 'expert' :
                         finalWeight >= 3.0 ? 'advanced' :
                         finalWeight >= 2.0 ? 'intermediate' : 'basic'

  const questionCount = Math.round(finalWeight * 2) // 2-10 questions based on importance

  return {
    onetImportance,
    marketAdjustment,
    companyWeight,
    finalWeight: Math.round(finalWeight * 10) / 10, // Round to 1 decimal
    difficultyLevel,
    questionCount,
    performanceCorrelation: historicalPerformance
  }
}

/**
 * Get market intelligence (placeholder for real API integration)
 */
export async function getMarketIntelligence(
  socCode: string,
  skillName: string,
  region: string = 'Tampa-St. Petersburg'
): Promise<MarketIntelligence> {
  
  // TODO: Integrate with real APIs (LinkedIn, Indeed, Glassdoor, PayScale)
  // For now, return enhanced mock data based on SOC patterns
  
  const demandPatterns = {
    '15-': 'high',      // Computer occupations
    '11-': 'critical',  // Management
    '13-': 'moderate',  // Business/Financial
    '29-': 'high',      // Healthcare
    '25-': 'moderate'   // Education
  }

  const socPrefix = socCode.substring(0, 3)
  const currentDemand = demandPatterns[socPrefix as keyof typeof demandPatterns] || 'moderate'

  return {
    currentDemand,
    salaryRange: '$45,000 - $85,000',
    trendDirection: 'rising',
    primaryIndustries: ['Technology', 'Healthcare', 'Finance'],
    emergingRequirements: ['Digital transformation', 'Remote collaboration'],
    region
  }
}

/**
 * Get company context (enhanced from job posting or company profile)
 */
export async function getCompanyContext(
  companyId: string | null,
  jobDescription?: string
): Promise<CompanyContext> {
  
  // TODO: Integrate with company profiles and job posting analysis
  // For now, return structured context
  
  return {
    roleLevel: 'mid',
    teamSize: '5-15 people',
    budgetSize: '$500K-2M',
    industry: 'Technology Services',
    regulatoryEnvironment: 'Standard compliance',
    performanceMetrics: ['Revenue growth', 'Team productivity', 'Customer satisfaction'],
    organizationValues: ['Innovation', 'Collaboration', 'Results-driven']
  }
}
