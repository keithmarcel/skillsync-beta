// Assessment Proficiency Engine - Enterprise-Grade Assessment Intelligence
// Sister service to Quiz Generation Engine with same precision and sophistication

import OpenAI from 'openai';
import { getOpenAIModel } from '../config/openai';
import { createClient } from '@supabase/supabase-js'
import { 
  generateEnhancedAIContext, 
  getMarketIntelligence, 
  getCompanyContext,
  calculateSkillWeighting,
  type MarketIntelligence,
  type CompanyContext
} from './enhanced-ai-context'

// Use server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface AssessmentWeighting {
  // From Quiz Generation Engine
  questionImportance: number        // 1.0-5.0 (critical questions weighted higher)
  difficultyLevel: string          // 'entry'|'mid'|'senior'|'executive'
  
  // From Skills Weighting Display  
  skillImportance: number          // 1.0-5.0 (company-specific importance)
  proficiencyThreshold: number     // 50-100% (company requirement)
  
  // From Enhanced AI Context
  marketDemand: number             // 1.0-3.0 (market demand multiplier)
  regionalWeight: number           // 0.8-1.2 (Tampa Bay specific)
  
  // Assessment-Specific
  responseQuality: number          // 0.0-1.0 (AI-evaluated response quality)
  contextualAccuracy: number       // 0.0-1.0 (real-world application)
}

export interface AIEvaluationResult {
  technicalAccuracy: number       // 0-100%
  practicalApplication: number    // 0-100%
  industryRelevance: number       // 0-100%
  completeness: number            // 0-100%
  overallQuality: number          // 0-100%
  reasoning: string               // Detailed explanation
  improvementAreas: string[]      // Specific development areas
}

export interface SkillProficiency {
  skillId: string
  skillName: string
  currentLevel: number            // 0-100% (weighted final score)
  requiredLevel: number           // Company threshold or market standard
  gap: number                     // Required - Current
  importance: number              // 1.0-5.0 skill importance
  status: 'Exceeds' | 'Meets' | 'Developing' | 'Gap'
}

export interface RoleReadinessScore {
  // Overall Metrics
  overallProficiency: number       // 0-100% (weighted final score)
  roleReadiness: 'Not Ready' | 'Developing' | 'Ready' | 'Highly Qualified'
  
  // Skill-Level Breakdown
  skillProficiencies: SkillProficiency[]
  
  // Actionable Intelligence
  strengthAreas: string[]          // Skills above 85%
  developmentAreas: string[]       // Skills below threshold
  criticalGaps: string[]           // Skills below 60% that are high importance
  
  // Recommendations
  nextSteps: string[]              // Specific actions to improve
  estimatedTimeToReady: string     // "3-6 months with focused learning"
  lastAssessmentDate: string
}

export interface QualifiedCandidate {
  userId: string
  userProfile: {
    name: string
    email: string
    location?: string
  }
  overallProficiency: number
  roleReadiness: string
  
  // Pre-qualification Status
  meetsHardRequirements: boolean
  meetsSoftRequirements: boolean
  qualificationLevel: 'Highly Qualified' | 'Qualified' | 'Developing'
  
  // Skill Matching
  skillMatch: {
    requiredSkillsScore: number    // Average of required skills
    preferredSkillsScore: number   // Average of preferred skills
    standoutSkills: string[]       // Skills above 95%
  }
  
  // Ranking Factors
  rankingScore: number             // For sorting in admin dashboard
  lastAssessmentDate: string
  improvementTrend: 'Improving' | 'Stable' | 'Declining'
}

// ============================================================================
// WEIGHTED SCORING ENGINE
// ============================================================================

/**
 * Calculate weighted scores using three-layer weighting system
 * Layer 1: Question-level importance (from quiz_questions.importance)
 * Layer 2: Skill-level importance (from skills.onet_importance or job_skills)
 * Layer 3: Market demand multipliers (future enhancement)
 */
export async function calculateWeightedScore(
  userResponses: Array<{
    questionId: string
    skillId: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    timeSpent: number
    difficulty?: string
    questionImportance?: number
  }>,
  quizId: string,
  companyId?: string
): Promise<Array<{
  skillId: string
  rawScore: number
  weightedScore: number
  aiEvaluation: AIEvaluationResult
}>> {
  
  // 1. Get quiz and skill data
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('soc_code, company_id, job_id')
    .eq('id', quizId)
    .single()

  // 2. Get skill importance from job_skills (company-specific) or skills table (O*NET)
  const { data: jobSkills } = await supabase
    .from('job_skills')
    .select('skill_id, importance_level, proficiency_threshold, skills(onet_importance)')
    .eq('job_id', quiz?.job_id || '')

  // 3. Group responses by skill
  const skillGroups = userResponses.reduce((groups, response) => {
    if (!groups[response.skillId]) {
      groups[response.skillId] = []
    }
    groups[response.skillId].push(response)
    return groups
  }, {} as Record<string, typeof userResponses>)

  // 4. Calculate weighted scores for each skill
  const skillScores = []
  
  for (const [skillId, responses] of Object.entries(skillGroups)) {
    // Get skill importance (company-specific or O*NET default)
    const jobSkill = jobSkills?.find(js => js.skill_id === skillId)
    const skills = jobSkill?.skills as any
    const skillImportance = skills?.onet_importance || 3.0
    
    // Calculate question-level weighted score
    let totalWeightedScore = 0
    let totalPossibleWeight = 0
    
    for (const response of responses) {
      // Question importance (from quiz_questions.importance, default 3.0)
      const questionImportance = response.questionImportance || 3.0
      
      // Difficulty multiplier (harder questions worth more)
      const difficultyMultiplier = getDifficultyMultiplier(response.difficulty || 'medium')
      
      // Question score: 100 if correct, 0 if wrong
      const questionScore = response.isCorrect ? 100 : 0
      
      // Weighted question score
      const weightedQuestionScore = questionScore * questionImportance * difficultyMultiplier
      
      totalWeightedScore += weightedQuestionScore
      totalPossibleWeight += 100 * questionImportance * difficultyMultiplier
    }
    
    // Raw score (simple percentage correct)
    const correctCount = responses.filter(r => r.isCorrect).length
    const rawScore = (correctCount / responses.length) * 100
    
    // Weighted score (accounts for question importance and difficulty)
    const weightedScore = totalPossibleWeight > 0 
      ? (totalWeightedScore / totalPossibleWeight) * 100 
      : rawScore
    
    // Placeholder AI evaluation (not used for scoring currently)
    const aiEvaluation: AIEvaluationResult = {
      technicalAccuracy: rawScore,
      practicalApplication: rawScore,
      industryRelevance: rawScore,
      completeness: rawScore,
      overallQuality: rawScore,
      reasoning: 'Score based on correctness',
      improvementAreas: []
    }
    
    skillScores.push({
      skillId,
      rawScore,
      weightedScore: Math.min(100, weightedScore), // Cap at 100%
      aiEvaluation
    })
  }
  
  return skillScores
}

/**
 * Get difficulty multiplier for question weighting
 * Harder questions are worth more points
 */
function getDifficultyMultiplier(difficulty: string): number {
  switch (difficulty.toLowerCase()) {
    case 'easy':
    case 'beginner':
      return 0.8
    case 'medium':
    case 'intermediate':
      return 1.0
    case 'hard':
    case 'advanced':
    case 'expert':
      return 1.3
    default:
      return 1.0
  }
}

// ============================================================================
// AI PROFICIENCY EVALUATOR
// ============================================================================

async function evaluateResponseQuality(
  responses: Array<{
    questionId: string
    skillId: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    timeSpent: number
  }>,
  socCode: string,
  skillName: string,
  marketData: MarketIntelligence,
  companyData: CompanyContext
): Promise<AIEvaluationResult> {
  
  try {
    // Generate enhanced AI context (reuse from quiz generation)
    const enhancedContext = await generateEnhancedAIContext(
      socCode,
      skillName,
      {
        importance: 3.5, // Default importance
        workActivities: ['Standard occupational tasks'],
        knowledge: ['Domain expertise required'],
        jobZone: { education: 'Post-secondary', experience: 'Moderate' }
      },
      marketData,
      companyData
    )
    
    // Prepare response analysis
    const responseAnalysis = responses.map(r => ({
      question: `Question about ${skillName}`,
      correctAnswer: r.correctAnswer,
      userResponse: r.userAnswer,
      isCorrect: r.isCorrect,
      timeSpent: r.timeSpent
    }))
    
    const evaluationPrompt = `
${enhancedContext}

ASSESSMENT EVALUATION TASK:
You are evaluating a job seeker's responses to assess their true proficiency in ${skillName} for ${socCode} roles.

RESPONSES TO EVALUATE:
${responseAnalysis.map((r, i) => `
Response ${i + 1}:
- Correct Answer: ${r.correctAnswer}
- User Response: ${r.userResponse}
- Correctness: ${r.isCorrect ? 'Correct' : 'Incorrect'}
- Time Spent: ${r.timeSpent}s
`).join('\n')}

EVALUATION CRITERIA:
1. Technical Accuracy (0-100%): How technically sound are the responses?
2. Practical Application (0-100%): Do responses show real-world understanding?
3. Industry Relevance (0-100%): Are responses relevant to ${socCode} requirements?
4. Completeness (0-100%): How thorough is the demonstrated knowledge?

CONTEXT CONSIDERATIONS:
- Market demand: ${marketData.currentDemand}
- Salary range: ${marketData.salaryRange}
- Industry trend: ${marketData.trendDirection}
- Company context: ${companyData.industry || 'General'}

RESPONSE FORMAT (JSON only):
{
  "technicalAccuracy": 85,
  "practicalApplication": 90,
  "industryRelevance": 88,
  "completeness": 82,
  "overallQuality": 86,
  "reasoning": "Detailed explanation of the evaluation focusing on strengths and areas for improvement",
  "improvementAreas": ["specific area 1", "specific area 2", "specific area 3"]
}
`

    const completion = await openai.chat.completions.create({
      model: getOpenAIModel(), // Uses centralized config (gpt-4o-mini by default)
      messages: [
        {
          role: "system",
          content: "You are an expert assessment evaluator for workforce development. Provide precise, actionable evaluations that help job seekers understand their true proficiency levels."
        },
        {
          role: "user",
          content: evaluationPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for consistent evaluation
      max_tokens: 1000
    })
    
    const result = JSON.parse(completion.choices[0].message.content || '{}')
    
    return {
      technicalAccuracy: result.technicalAccuracy || 0,
      practicalApplication: result.practicalApplication || 0,
      industryRelevance: result.industryRelevance || 0,
      completeness: result.completeness || 0,
      overallQuality: result.overallQuality || 0,
      reasoning: result.reasoning || 'Evaluation completed',
      improvementAreas: result.improvementAreas || []
    }
    
  } catch (error) {
    console.error('AI evaluation failed:', error)
    
    // Fallback to basic evaluation
    const correctCount = responses.filter(r => r.isCorrect).length
    const accuracy = (correctCount / responses.length) * 100
    
    return {
      technicalAccuracy: accuracy,
      practicalApplication: accuracy * 0.9,
      industryRelevance: accuracy * 0.85,
      completeness: accuracy * 0.8,
      overallQuality: accuracy * 0.85,
      reasoning: 'Basic evaluation due to AI service unavailability',
      improvementAreas: ['Review fundamental concepts', 'Practice application scenarios']
    }
  }
}

// ============================================================================
// ROLE READINESS CALCULATOR
// ============================================================================

export async function calculateRoleReadiness(
  userId: string,
  roleId: string,
  skillScores: Array<{
    skillId: string
    rawScore: number
    weightedScore: number
    aiEvaluation: AIEvaluationResult
  }>
): Promise<RoleReadinessScore> {
  
  // 1. Get role requirements and skill data
  const { data: role } = await supabase
    .from('featured_roles')
    .select('*, company:companies(*)')
    .eq('id', roleId)
    .single()

  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .in('id', skillScores.map(s => s.skillId))

  const { data: skillWeights } = await supabase
    .from('skill_weightings')
    .select('*')
    .eq('role_id', roleId)

  // 2. Calculate skill proficiencies
  const skillProficiencies: SkillProficiency[] = skillScores.map(score => {
    const skill = skills?.find(s => s.id === score.skillId)
    const weight = skillWeights?.find(w => w.skill_id === score.skillId)
    const requiredLevel = role?.proficiency_threshold || 75
    
    return {
      skillId: score.skillId,
      skillName: skill?.name || 'Unknown Skill',
      currentLevel: score.rawScore, // Use raw score for accurate proficiency
      requiredLevel,
      gap: Math.max(0, requiredLevel - score.rawScore),
      importance: weight?.importance || 3.0,
      status: getSkillStatus(score.rawScore, requiredLevel)
    }
  })

  // 3. Calculate overall proficiency (importance-weighted average)
  const totalImportanceWeight = skillProficiencies.reduce((sum, skill) => sum + skill.importance, 0)
  const weightedSum = skillProficiencies.reduce((sum, skill) => 
    sum + (skill.currentLevel * skill.importance), 0
  )
  const overallProficiency = totalImportanceWeight > 0 ? weightedSum / totalImportanceWeight : 0

  // 4. Determine role readiness level
  const roleReadiness = getRoleReadinessLevel(overallProficiency, skillProficiencies)

  // 5. Generate actionable intelligence
  const strengthAreas = skillProficiencies
    .filter(skill => skill.currentLevel >= 85)
    .map(skill => skill.skillName)

  const developmentAreas = skillProficiencies
    .filter(skill => skill.gap > 0 && skill.gap <= 20)
    .map(skill => skill.skillName)

  const criticalGaps = skillProficiencies
    .filter(skill => skill.currentLevel < 60 && skill.importance >= 4.0)
    .map(skill => skill.skillName)

  // 6. Generate recommendations
  const nextSteps = generateNextSteps(skillProficiencies, overallProficiency)
  const estimatedTimeToReady = estimateTimeToReady(skillProficiencies, overallProficiency)

  // 7. Save results to database
  await supabase
    .from('role_readiness_scores')
    .upsert({
      user_id: userId,
      role_id: roleId,
      soc_code: role?.soc_code,
      overall_proficiency: overallProficiency,
      role_readiness: roleReadiness,
      critical_gaps: criticalGaps,
      development_areas: developmentAreas,
      calculated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() // 6 months
    })

  return {
    overallProficiency,
    roleReadiness,
    skillProficiencies,
    strengthAreas,
    developmentAreas,
    criticalGaps,
    nextSteps,
    estimatedTimeToReady,
    lastAssessmentDate: new Date().toISOString()
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getSkillStatus(currentLevel: number, requiredLevel: number): 'Exceeds' | 'Meets' | 'Developing' | 'Gap' {
  if (currentLevel >= requiredLevel + 10) return 'Exceeds'
  if (currentLevel >= requiredLevel) return 'Meets'
  if (currentLevel >= requiredLevel - 15) return 'Developing'
  return 'Gap'
}

function getRoleReadinessLevel(
  overallProficiency: number, 
  skillProficiencies: SkillProficiency[]
): 'Not Ready' | 'Developing' | 'Ready' | 'Highly Qualified' {
  const criticalGaps = skillProficiencies.filter(s => s.status === 'Gap' && s.importance >= 4.0).length
  
  if (overallProficiency >= 90 && criticalGaps === 0) return 'Highly Qualified'
  if (overallProficiency >= 75 && criticalGaps === 0) return 'Ready'
  if (overallProficiency >= 60) return 'Developing'
  return 'Not Ready'
}

function generateNextSteps(skillProficiencies: SkillProficiency[], overallProficiency: number): string[] {
  const steps = []
  
  // Focus on critical gaps first
  const criticalGaps = skillProficiencies.filter(s => s.status === 'Gap' && s.importance >= 4.0)
  if (criticalGaps.length > 0) {
    steps.push(`Focus on critical skills: ${criticalGaps.slice(0, 2).map(s => s.skillName).join(', ')}`)
  }
  
  // Then development areas
  const developmentAreas = skillProficiencies.filter(s => s.status === 'Developing')
  if (developmentAreas.length > 0) {
    steps.push(`Strengthen developing skills: ${developmentAreas.slice(0, 2).map(s => s.skillName).join(', ')}`)
  }
  
  // Overall guidance
  if (overallProficiency < 60) {
    steps.push('Consider foundational training programs to build core competencies')
  } else if (overallProficiency < 75) {
    steps.push('Focus on targeted skill development to reach role-ready status')
  } else {
    steps.push('Fine-tune advanced skills to become highly qualified')
  }
  
  return steps
}

function estimateTimeToReady(skillProficiencies: SkillProficiency[], overallProficiency: number): string {
  const totalGap = skillProficiencies.reduce((sum, skill) => sum + skill.gap, 0)
  const criticalGaps = skillProficiencies.filter(s => s.status === 'Gap' && s.importance >= 4.0).length
  
  if (overallProficiency >= 75) return 'Role-ready now'
  if (overallProficiency >= 60 && criticalGaps === 0) return '1-3 months with focused learning'
  if (overallProficiency >= 45) return '3-6 months with structured training'
  return '6-12 months with comprehensive education program'
}

export default {
  calculateWeightedScore,
  calculateRoleReadiness,
  evaluateResponseQuality
}
