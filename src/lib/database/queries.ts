import { supabase } from '@/lib/supabase/client'

// Types for database entities
export interface Job {
  id: string;
  job_kind: 'featured_role' | 'occupation';
  title: string;
  soc_code: string | null;
  company_id: string | null;
  job_type: string | null;
  category: string | null;
  location_city: string | null;
  location_state: string | null;
  median_wage_usd: number | null;
  long_desc: string | null;
  featured_image_url: string | null;
  skills_count: number;
  is_featured: boolean;
  employment_outlook: string | null;
  education_level: string | null;
  work_experience: string | null;
  on_job_training: string | null;
  job_openings_annual: number | null;
  growth_rate_percent: number | null;
  required_proficiency_pct: number | null;
  // Company-specific fields for featured roles
  core_responsibilities: string | null;
  growth_opportunities: string | null;
  team_structure: string | null;
  work_environment: string | null;
  travel_requirements: string | null;
  performance_metrics: string | null;
  training_provided: string | null;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published' | 'archived';
  company?: Company;
  skills?: JobSkill[];
}

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  is_trusted_partner: boolean;
  is_published: boolean;
  hq_city: string | null;
  hq_state: string | null;
  revenue_range: string | null;
  employee_range: string | null;
  industry: string | null;
  bio: string | null;
  company_image_url: string | null;
}

export interface Program {
  id: string;
  school_id: string | null;
  name: string;
  program_id: string;
  program_type: string | null;
  format: string | null;
  duration_text: string | null;
  short_desc: string | null;
  long_desc: string | null;
  discipline: string | null;
  catalog_provider: string | null;
  program_url: string | null;
  program_guide_url: string | null;
  cip_code: string | null;
  is_featured: boolean;
  featured_image_url: string | null;
  skills_count: number;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  school?: School;
  skills?: ProgramSkill[];
}

export interface School {
  id: string
  name: string
  logo_url: string | null
  about_url: string | null
  city: string | null
  state: string | null
  catalog_affiliation: string | null
}

export interface AssessmentSkillResult {
  id: string
  assessment_id: string
  skill_id: string
  score: number
  score_pct: number
  proficiency_level: 'beginner' | 'intermediate' | 'expert'
  band?: string
  correct_answers?: number
  total_questions?: number
  skill?: Skill
}

export interface Assessment {
  id: string
  user_id: string | null
  job_id: string | null
  quiz_id: string | null
  total_score: number
  proficiency_level: 'beginner' | 'intermediate' | 'expert'
  completed_at: string
  created_at: string
  is_active?: boolean
  readiness_pct?: number | null
  analyzed_at?: string
  method?: string
  status_tag?: string
  job?: Job
  quiz?: Quiz
  skill_results?: AssessmentSkillResult[]
}

export interface Skill {
  id: string
  name: string
  onet_id: string | null
  category: string | null
  description: string | null
  proficiency_levels: {
    beginner: string
    intermediate: string
    expert: string
  } | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface JobSkill {
  job_id: string
  skill_id: string
  importance_level: 'critical' | 'important' | 'helpful'
  proficiency_threshold: number
  weight: number
  onet_data_source: any
  skill?: Skill
}

export interface ProgramSkill {
  program_id: string
  skill_id: string
  coverage_level: 'primary' | 'secondary' | 'supplemental'
  weight: number
  skill?: Skill
}

export interface Quiz {
  id: string
  soc_code: string
  title: string
  description: string | null
  estimated_minutes: number
  total_questions: number
  questions_per_assessment: number
  version: number
  status: 'draft' | 'published' | 'archived'
  ai_generated: boolean
  is_standard: boolean
  company_id: string | null
  company?: Company
  sections?: QuizSection[]
  created_at: string
  updated_at: string
}

export interface QuizSection {
  id: string
  quiz_id: string
  skill_id: string
  title: string
  description: string | null
  questions_per_section: number
  total_questions: number
  order_index: number
  skill?: Skill
  questions?: QuizQuestion[]
  created_at: string
}

export interface QuizQuestion {
  id: string
  section_id: string
  skill_id: string
  stem: string
  choices: Record<string, string>
  correct_answer: string
  explanation: string | null
  difficulty: 'beginner' | 'intermediate' | 'expert' | null
  points: number
  is_active: boolean
  usage_count: number
  last_used_at: string | null
  skill?: Skill
  created_at: string
}

// Job queries
export async function getFeaturedRoles(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      company:companies(*),
      skills:job_skills(
        weight,
        skill:skills(*)
      )
    `)
    .eq('job_kind', 'featured_role')
    .eq('is_featured', true)
    .order('title')

  if (error) {
    console.error('Error fetching featured roles:', error)
    // If column doesn't exist, return empty array (will be fixed after migration)
    if (error.message.includes('is_published')) {
      console.warn('is_published column not found - please run database migration')
      return []
    }
    return []
  }

  // Filter by published status (skip if column doesn't exist yet)
  const filteredData = data?.filter(job => {
    const company = job.company as any
    return company?.is_published !== false // Allow null/undefined (column doesn't exist yet)
  }) || []

  return filteredData
}

export async function getHighDemandOccupations(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      skills:job_skills(
        weight,
        skill:skills(*)
      )
    `)
    .eq('job_kind', 'occupation')
    .order('title')

  if (error) {
    console.error('Error fetching high demand occupations:', error)
    return []
  }

  // Filter by published status (skip if column doesn't exist yet)
  const filteredData = data?.filter(job => {
    const company = (job as any).company as any
    // Allow occupations (no company) or jobs from published companies
    return !job.company_id || company?.is_published !== false
  }) || []

  return filteredData
}

export async function getJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      company:companies(*),
      skills:job_skills(
        weight,
        skill:skills(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching job:', error)
    return null
  }

  // Check if job's company is published (skip if column doesn't exist yet or job has no company)
  if (data && data.company_id) {
    const company = data.company as any
    if (company?.is_published === false) {
      return null // Job is from unpublished company
    }
  }

  return data as Job
}

// Program queries
export async function getFeaturedPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      school:schools(*),
      skills:program_skills(
        weight,
        skill:skills(*)
      )
    `)
    .eq('is_featured', true)
    .limit(6)
    .order('name')

  if (error) {
    console.error('Error fetching featured programs:', error)
    return []
  }

  return data || []
}

export async function getAllPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      school:schools(*),
      skills:program_skills(
        weight,
        skill:skills(*)
      )
    `)
    .order('name')

  if (error) {
    console.error('Error fetching all programs:', error)
    return []
  }

  return data || []
}

export async function getProgramById(id: string): Promise<Program | null> {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      school:schools(*),
      skills:program_skills(
        weight,
        skill:skills(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching program:', error)
    return null
  }

  return data
}

// Assessment queries
export async function getUserAssessments(userId: string): Promise<Assessment[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select(`
      *,
      job:jobs(*),
      skill_results:assessment_skill_results(
        *,
        skill:skills(*)
      )
    `)
    .eq('user_id', userId)
    .order('analyzed_at', { ascending: false })

  if (error) {
    console.error('Error fetching user assessments:', error)
    return []
  }

  return data || []
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select(`
      *,
      job:jobs(*),
      skill_results:assessment_skill_results(
        *,
        skill:skills(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching assessment:', error)
    return null
  }

  return data
}

// Company queries
export async function getCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching companies:', error)
    return []
  }

  return data || []
}

export async function getTrustedPartners(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching trusted partners:', error)
    return []
  }

  // Filter for published companies (or all if column doesn't exist yet)
  const filteredData = data?.filter(company => {
    return (company as any).is_published !== false // Allow null/undefined (column doesn't exist yet)
  }) || []

  return filteredData
}

// School queries
export async function getSchools(): Promise<School[]> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching schools:', error)
    return []
  }

  return data || []
}


export async function getUserFavoriteJobs(userId: string): Promise<Job[]> {
  if (!userId) return [];

  const { data, error } = await supabase.rpc('get_favorite_jobs_with_company');

  if (error) {
    console.error('Error fetching favorite jobs:', error);
    return [];
  }

  // Filter out jobs from unpublished companies (but allow jobs without companies)
  const publishedJobs = data?.filter((job: Job) => {
    // Allow high-demand occupations (no company) or jobs from published companies
    return !job.company_id || job.company?.is_published;
  }) || [];

  return publishedJobs;
}

export async function getUserFavoritePrograms(userId: string): Promise<Program[]> {
  if (!userId) return [];

  const { data, error } = await supabase.rpc('get_favorite_programs_with_school');

  if (error) {
    console.error('Error fetching favorite programs:', error);
    return [];
  }

  return data || [];
}

export async function addToFavorites(userId: string, entityKind: 'job' | 'program', entityId: string): Promise<boolean> {
  try {
    // Use upsert to handle duplicates gracefully
    const { error } = await supabase
      .from('favorites')
      .upsert({
        user_id: userId,
        entity_kind: entityKind,
        entity_id: entityId
      }, {
        onConflict: 'user_id,entity_kind,entity_id'
      })

    if (error) {
      console.error('Error adding to favorites:', error);
      return false
    }

    return true
  } catch (catchError) {
    console.error('Exception adding to favorites:', catchError)
    return false
  }
}

export async function removeFromFavorites(userId: string, entityKind: 'job' | 'program', entityId: string): Promise<boolean> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('entity_kind', entityKind)
    .eq('entity_id', entityId)

  if (error) {
    console.error('Error removing from favorites:', error);
    return false
  }

  return true
}

export async function isFavorite(userId: string, entityKind: 'job' | 'program', entityId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('favorites')
    .select('entity_id')
    .eq('user_id', userId)
    .eq('entity_kind', entityKind)
    .eq('entity_id', entityId)
    .single()

  if (error) {
    // If no record found, it's not a favorite
    return false
  }

  return !!data
}

// Enhanced Skills Taxonomy Queries
export async function getSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching skills:', error)
    return []
  }

  return data || []
}

export async function getSkillsByCategory(category: string): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching skills by category:', error)
    return []
  }

  return data || []
}

export async function getSkillCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('category')
    .not('category', 'is', null)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching skill categories:', error)
    return []
  }

  // Get unique categories
  const categories = Array.from(new Set(data?.map(item => item.category) || []))
  return categories.sort()
}

export async function getJobSkills(jobId: string): Promise<JobSkill[]> {
  const { data, error } = await supabase
    .from('job_skills')
    .select(`
      *,
      skill:skills(*)
    `)
    .eq('job_id', jobId)
    .order('importance_level', { ascending: false })
    .order('weight', { ascending: false })

  if (error) {
    console.error('Error fetching job skills:', error)
    return []
  }

  return data || []
}

export async function getProgramSkills(programId: string): Promise<ProgramSkill[]> {
  const { data, error } = await supabase
    .from('program_skills')
    .select(`
      *,
      skill:skills(*)
    `)
    .eq('program_id', programId)
    .order('coverage_level', { ascending: false })
    .order('weight', { ascending: false })

  if (error) {
    console.error('Error fetching program skills:', error)
    return []
  }

  return data || []
}

export async function getSkillsForSocCode(socCode: string): Promise<JobSkill[]> {
  // Find jobs with this SOC code and get their skills
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id')
    .eq('soc_code', socCode)

  if (jobsError || !jobs || jobs.length === 0) {
    console.error('Error finding jobs for SOC code:', jobsError)
    return []
  }

  // Get skills for the first job with this SOC code
  // (assuming all jobs with same SOC code should have same skills)
  return getJobSkills(jobs[0].id)
}

export async function createSkill(skillData: {
  name: string
  category: string
  description?: string
  onet_id?: string
  proficiency_levels?: any
}): Promise<Skill | null> {
  const { data, error } = await supabase
    .from('skills')
    .insert(skillData)
    .select()
    .single()

  if (error) {
    console.error('Error creating skill:', error)
    return null
  }

  return data
}

export async function addSkillToJob(jobId: string, skillId: string, skillData: {
  importance_level: 'critical' | 'important' | 'helpful'
  proficiency_threshold?: number
  weight?: number
  onet_data_source?: any
}): Promise<boolean> {
  const { error } = await supabase
    .from('job_skills')
    .insert({
      job_id: jobId,
      skill_id: skillId,
      ...skillData
    })

  if (error) {
    console.error('Error adding skill to job:', error)
    return false
  }

  return true
}

export async function addSkillToProgram(programId: string, skillId: string, skillData: {
  coverage_level: 'primary' | 'secondary' | 'supplemental'
  weight?: number
}): Promise<boolean> {
  const { error } = await supabase
    .from('program_skills')
    .insert({
      program_id: programId,
      skill_id: skillId,
      ...skillData
    })

  if (error) {
    console.error('Error adding skill to program:', error)
    return false
  }

  return true
}

// Quiz System Queries
export async function getQuizBySocCode(socCode: string, companyId?: string): Promise<Quiz | null> {
  const { data, error } = await supabase
    .from('quizzes')
    .select(`
      *,
      company:companies(*),
      sections:quiz_sections(
        *,
        skill:skills(*),
        questions:quiz_questions(count)
      )
    `)
    .eq('soc_code', socCode)
    .eq('is_standard', !companyId)
    .eq('company_id', companyId || null)
    .eq('status', 'published')
    .single()

  if (error) {
    console.error('Error fetching quiz by SOC code:', error)
    return null
  }

  return data as Quiz
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  const { data, error } = await supabase
    .from('quizzes')
    .select(`
      *,
      company:companies(*),
      sections:quiz_sections(
        *,
        skill:skills(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching quiz:', error)
    return null
  }

  return data as Quiz
}

export async function getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select(`
      *,
      skill:skills(*)
    `)
    .eq('section_id', (
      await supabase
        .from('quiz_sections')
        .select('id')
        .eq('quiz_id', quizId)
    ).data?.map(s => s.id) || [])
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching quiz questions:', error)
    return []
  }

  return data || []
}

export async function getAssessmentQuestions(assessmentId: string): Promise<QuizQuestion[]> {
  const { data, error } = await supabase
    .from('assessment_responses')
    .select(`
      question:quiz_questions(*, skill:skills(*))
    `)
    .eq('assessment_id', assessmentId)

  if (error) {
    console.error('Error fetching assessment questions:', error)
    return []
  }

  return data?.map(item => item.question) || []
}

export async function createAssessment(assessmentData: {
  user_id: string
  quiz_id: string
  job_id?: string
  selected_questions: string[]
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('assessments')
    .insert({
      user_id: assessmentData.user_id,
      quiz_id: assessmentData.quiz_id,
      job_id: assessmentData.job_id,
      selected_questions: assessmentData.selected_questions,
      method: 'quiz'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating assessment:', error)
    return null
  }

  return data.id
}

export async function submitAssessmentResponse(
  assessmentId: string,
  questionId: string,
  selectedAnswer: string,
  timeSpentSeconds: number
): Promise<boolean> {
  // Get the correct answer
  const { data: question } = await supabase
    .from('quiz_questions')
    .select('correct_answer')
    .eq('id', questionId)
    .single()

  if (!question) return false

  const isCorrect = selectedAnswer === question.correct_answer

  const { error } = await supabase
    .from('assessment_responses')
    .insert({
      assessment_id: assessmentId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      time_spent_seconds: timeSpentSeconds
    })

  if (error) {
    console.error('Error submitting assessment response:', error)
    return false
  }

  // Update question usage statistics
  await supabase
    .from('quiz_questions')
    .update({
      usage_count: supabase.raw('usage_count + 1'),
      last_used_at: new Date().toISOString()
    })
    .eq('id', questionId)

  return true
}

export async function completeAssessment(assessmentId: string): Promise<boolean> {
  const { data: responses } = await supabase
    .from('assessment_responses')
    .select(`
      question:quiz_questions(skill_id, points),
      is_correct
    `)
    .eq('assessment_id', assessmentId)

  if (!responses) return false

  // Calculate skill-level results
  const skillResults = new Map<string, { correct: number, total: number, totalPoints: number }>()

  for (const response of responses) {
    const skillId = response.question.skill_id
    const points = response.question.points

    if (!skillResults.has(skillId)) {
      skillResults.set(skillId, { correct: 0, total: 0, totalPoints: 0 })
    }

    const result = skillResults.get(skillId)!
    result.total++
    result.totalPoints += points
    if (response.is_correct) {
      result.correct++
    }
  }

  // Insert skill results
  const skillResultInserts = Array.from(skillResults.entries()).map(([skillId, result]) => ({
    assessment_id: assessmentId,
    skill_id: skillId,
    score_pct: (result.correct / result.total) * 100,
    band: calculateProficiencyBand((result.correct / result.total) * 100),
    correct_answers: result.correct,
    total_questions: result.total
  }))

  const { error: skillResultsError } = await supabase
    .from('assessment_skill_results')
    .insert(skillResultInserts)

  if (skillResultsError) {
    console.error('Error saving skill results:', skillResultsError)
    return false
  }

  // Calculate overall readiness score
  const overallScore = skillResultInserts.reduce((sum, result) => sum + result.score_pct, 0) / skillResultInserts.length

  // Update assessment with completion data
  const { error: updateError } = await supabase
    .from('assessments')
    .update({
      readiness_pct: overallScore,
      status_tag: getReadinessStatus(overallScore),
      completed_at: new Date().toISOString()
    })
    .eq('id', assessmentId)

  if (updateError) {
    console.error('Error completing assessment:', updateError)
    return false
  }

  return true
}

function calculateProficiencyBand(scorePct: number): 'needs_development' | 'building' | 'proficient' {
  if (scorePct >= 85) return 'proficient'
  if (scorePct >= 50) return 'building'
  return 'needs_development'
}

function getReadinessStatus(overallScore: number): 'role_ready' | 'close_gaps' | 'needs_development' {
  if (overallScore >= 85) return 'role_ready'
  if (overallScore >= 50) return 'close_gaps'
  return 'needs_development'
}
