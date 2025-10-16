/**
 * Assessment & Quiz Types
 * 
 * Core types for the assessment management system including quizzes,
 * questions, sections, and assessment results.
 */

// Question Types
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'long_answer'

// Question Importance Levels (matches job_skills.importance_level)
export type ImportanceLevel = 1 | 2 | 3 | 4 | 5

// Question Difficulty Levels (matches existing weighting system)
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert'

// Quiz Status
export type QuizStatus = 'draft' | 'published' | 'archived'

// Assessment Status
export type AssessmentStatus = 'in_progress' | 'completed' | 'expired'

/**
 * Quiz Question
 * Represents a single question in a quiz
 */
export interface QuizQuestion {
  id: string
  section_id: string
  question_type: QuestionType
  stem: string // Question text (existing column name)
  
  // Multiple choice specific
  choices?: any // JSONB array of options (existing column name)
  
  // Answer fields
  answer_key: string // Correct answer (existing column name)
  good_answer_example?: string // For short_answer and long_answer AI scoring
  max_length?: number // 200 for short_answer, 1000 for long_answer
  
  // Weighting (matches existing system)
  importance_level: ImportanceLevel
  difficulty: DifficultyLevel
  
  // Associations
  skill_id?: string
  skill?: {
    id: string
    name: string
    category?: string
  }
  
  // Ordering
  display_order: number
  
  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Quiz Section
 * Groups questions by skill
 */
export interface QuizSection {
  id: string
  quiz_id: string
  skill_id?: string
  title: string
  description?: string
  display_order: number
  created_at: string
  updated_at: string
  
  // Relations
  questions?: QuizQuestion[]
  skill?: {
    id: string
    name: string
    category?: string
  }
}

/**
 * Quiz
 * Complete assessment for a role
 */
export interface Quiz {
  id: string
  job_id: string
  title: string
  description?: string
  status: QuizStatus
  required_proficiency_pct: number // Required proficiency - minimum score to be considered qualified for role
  
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
  
  // Relations
  sections?: QuizSection[]
  job?: {
    id: string
    title: string
    soc_code?: string
    company_id?: string
  }
  company?: {
    id: string
    name: string
    logo_url?: string
  }
  
  // Stats (computed)
  total_questions?: number
  total_assessments?: number
  avg_readiness?: number
}

/**
 * Assessment Result
 * User's completed assessment
 */
export interface Assessment {
  id: string
  user_id: string
  job_id: string
  quiz_id: string
  
  // Scores
  total_score: number
  proficiency_level: string
  readiness_pct: number
  
  // Results
  skill_results: SkillResult[]
  question_results: QuestionResult[]
  
  // AI Evaluation (optional)
  ai_evaluation?: AIEvaluation
  
  // Status
  status: AssessmentStatus
  started_at: string
  completed_at?: string
  analyzed_at?: string
  
  // Relations
  user?: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
  }
  job?: {
    id: string
    title: string
  }
  quiz?: {
    id: string
    title: string
  }
}

/**
 * Skill Result
 * Performance on a specific skill
 */
export interface SkillResult {
  skill_id: string
  skill_name: string
  proficiency_pct: number
  importance_level: ImportanceLevel
  status: 'exceeds' | 'meets' | 'developing' | 'gap'
  questions_correct: number
  questions_total: number
}

/**
 * Question Result
 * User's answer to a specific question
 */
export interface QuestionResult {
  question_id: string
  question_text: string
  question_type: QuestionType
  user_answer: string | boolean
  correct_answer: string | boolean
  is_correct: boolean
  time_spent_seconds: number
  ai_score?: number // For short_answer and long_answer
  ai_feedback?: string
}

/**
 * AI Evaluation
 * Detailed AI analysis of assessment
 */
export interface AIEvaluation {
  technical_accuracy: number // 0-100
  practical_application: number // 0-100
  industry_relevance: number // 0-100
  completeness: number // 0-100
  overall_quality: number // 0-100
  reasoning: string
  improvement_areas: string[]
  strengths: string[]
}

/**
 * Importance Level Config
 * UI configuration for importance levels
 */
export interface ImportanceLevelConfig {
  value: ImportanceLevel
  label: string
  description: string
  color: string
  proficiencyThreshold: number
}

/**
 * Difficulty Level Config
 * UI configuration for difficulty levels
 */
export interface DifficultyLevelConfig {
  value: DifficultyLevel
  label: string
  multiplier: number
  description: string
}

/**
 * Question Type Config
 * UI configuration for question types
 */
export interface QuestionTypeConfig {
  value: QuestionType
  label: string
  description: string
  icon: string
  maxLength?: number
  requiresGoodAnswer: boolean
}

// Constants for UI
export const IMPORTANCE_LEVELS: ImportanceLevelConfig[] = [
  { value: 5, label: 'Critical', description: 'Must-have skill, core job requirement', color: 'red', proficiencyThreshold: 80 },
  { value: 4, label: 'Important', description: 'Key competency for role', color: 'orange', proficiencyThreshold: 70 },
  { value: 3, label: 'Helpful', description: 'Supporting skill', color: 'yellow', proficiencyThreshold: 60 },
  { value: 2, label: 'Nice-to-have', description: 'Peripheral skill', color: 'gray', proficiencyThreshold: 50 },
  { value: 1, label: 'Optional', description: 'Tangential skill', color: 'gray', proficiencyThreshold: 40 }
]

export const DIFFICULTY_LEVELS: DifficultyLevelConfig[] = [
  { value: 'easy', label: 'Easy/Beginner', multiplier: 0.8, description: 'Everyone should get these right' },
  { value: 'medium', label: 'Medium/Intermediate', multiplier: 1.0, description: 'Standard difficulty' },
  { value: 'hard', label: 'Hard/Advanced', multiplier: 1.2, description: 'Challenging but fair' },
  { value: 'expert', label: 'Expert', multiplier: 1.3, description: 'Differentiates top performers' }
]

export const QUESTION_TYPES: QuestionTypeConfig[] = [
  { 
    value: 'multiple_choice', 
    label: 'Multiple Choice', 
    description: 'Best for testing knowledge with specific correct answers',
    icon: 'CheckSquare',
    requiresGoodAnswer: false
  },
  { 
    value: 'true_false', 
    label: 'True/False', 
    description: 'Best for yes/no or binary questions',
    icon: 'ToggleLeft',
    requiresGoodAnswer: false
  },
  { 
    value: 'short_answer', 
    label: 'Short Answer', 
    description: 'Best for custom screening questions (location, availability, etc.)',
    icon: 'Type',
    maxLength: 200,
    requiresGoodAnswer: true
  },
  { 
    value: 'long_answer', 
    label: 'Long Answer', 
    description: 'Best for technical depth and situational questions',
    icon: 'FileText',
    maxLength: 1000,
    requiresGoodAnswer: true
  }
]
