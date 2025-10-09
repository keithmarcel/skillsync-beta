// AI-powered quiz generation service for SOC-based assessments
// Generates reusable question pools per skill with rotation capabilities

import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { updateProgress } from '@/lib/utils/progress'
import { 
  generateEnhancedAIContext, 
  getMarketIntelligence, 
  getCompanyContext,
  calculateSkillWeighting
} from './enhanced-ai-context'

// Use server-side Supabase client for service operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Initialize OpenAI client
console.log('🔑 OpenAI API Key loaded:', process.env.OPENAI_API_KEY ? 'YES (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'NO - MISSING!');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export interface QuizGenerationOptions {
  socCode: string
  skillId: string
  skillName: string
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert'
  questionCount: number // Typically 8-10 per skill for 40+ total pool
  companyId?: string // For custom company quizzes
  sessionId?: string // For progress tracking
}

export interface GeneratedQuestion {
  stem: string
  choices: Record<string, string>
  correct_answer: string
  explanation: string
  difficulty: 'beginner' | 'intermediate' | 'expert'
}

/**
 * Generate a pool of questions for a specific skill within an SOC quiz
 */
export async function generateSkillQuestions(options: QuizGenerationOptions): Promise<GeneratedQuestion[]> {
  const { socCode, skillId, skillName, proficiencyLevel, questionCount } = options

  // Get skill context from database
  const { data: skill } = await supabase
    .from('skills')
    .select('*')
    .eq('id', skillId)
    .single()

  if (!skill) {
    throw new Error(`Skill ${skillId} not found`)
  }

  // Get job examples for this SOC code to provide context
  const { data: jobs } = await supabase
    .from('jobs')
    .select('title, long_desc')
    .eq('soc_code', socCode)
    .limit(3)

  const jobContext = jobs?.map(job => `${job.title}: ${job.long_desc?.substring(0, 200)}...`).join('\n\n') || ''

  // Generate questions in batches to avoid token limits
  const questions: GeneratedQuestion[] = []
  const batchSize = 3 // Generate 3 questions per API call

  for (let i = 0; i < questionCount; i += batchSize) {
    const batchCount = Math.min(batchSize, questionCount - i)

    try {
      const batchQuestions = await generateQuestionBatch({
        skill,
        proficiencyLevel,
        jobContext,
        count: batchCount,
        existingQuestions: questions, // Avoid duplicates
        socCode: options.socCode,
        companyId: options.companyId,
        sessionId: options.sessionId
      })

      questions.push(...batchQuestions)
    } catch (error) {
      console.error(`Failed to generate question batch ${i/batchSize + 1}:`, error)
      // Continue with next batch rather than failing entirely
    }
  }

  return questions
}

/**
 * Generate a batch of questions for a skill
 */
async function generateQuestionBatch({
  skill,
  proficiencyLevel,
  jobContext,
  count,
  existingQuestions,
  socCode,
  companyId,
  sessionId
}: {
  skill: any
  proficiencyLevel: string
  jobContext: string
  count: number
  existingQuestions: GeneratedQuestion[]
  socCode?: string
  companyId?: string
  sessionId?: string
}): Promise<GeneratedQuestion[]> {

  const existingStems = existingQuestions.map(q => q.stem.toLowerCase())

  // Get enhanced context data
  const marketData = await getMarketIntelligence(socCode || '', skill.name)
  const companyData = await getCompanyContext(companyId || null)
  
  // Calculate skill weighting for enhanced difficulty
  const skillWeighting = calculateSkillWeighting(
    skill.importance_level === 'critical' ? 4.5 :
    skill.importance_level === 'important' ? 3.5 : 2.5,
    marketData.currentDemand,
    3.0, // Default company weight
    0.75 // Default performance correlation
  )

  // Generate enhanced AI context
  const enhancedPrompt = await generateEnhancedAIContext(
    socCode || '',
    skill.name,
    {
      importance: skill.importance_level === 'critical' ? 4.5 :
                  skill.importance_level === 'important' ? 3.5 : 2.5,
      workActivities: ['Standard occupational tasks'],
      knowledge: ['Domain expertise required'],
      jobZone: { education: 'Post-secondary', experience: 'Moderate' }
    },
    marketData,
    sessionId
  )

  const prompt = `You are an Instructional Designer and Workforce Assessment Specialist working inside the SkillSync platform. You are creating quiz questions to evaluate a learner's readiness for a specific occupation.

This quiz will be taken by jobseekers, career changers, and upskilling employees. Your goal is to measure true competency—not surface knowledge.

Your task is to generate **high-quality multiple-choice questions (MCQs)** for the skill: "${skill.name}" at ${proficiencyLevel} level.

### PERSONA CONTEXT:
- Design questions as if you were an instructional designer building job-ready assessments for employers and workforce boards.
- Your goal is to evaluate readiness to **perform on the job**, not just memorize definitions.

### SKILL RELEVANCE:
- Only use the skill: "${skill.name}"
- Avoid generic skills like "Reading Comprehension," "English Language," "Oral Expression," "Near Vision," or any other passive or obvious abilities.
- Prioritize technical, operational, and applied skills relevant to the target occupation.

### QUESTION STRUCTURE:
- Generate ${count} high-quality MCQs for this skill.
- Each question should test **applied understanding**, not rote recall.
- Provide 4 answer choices (A–D) per question.
- Randomize answer order—**do not repeat the same letter for correct answers too often**.

### ANSWER KEY AND EXPLANATION:
- Mark the correct answer.
- Provide a one-sentence explanation of why it's correct.
- Ensure **each question and answer can be reused in a randomized quiz rotation system**.

### TONE AND ACCESSIBILITY:
- Keep reading level appropriate for a postsecondary audience (10th–12th grade).
- Avoid jargon unless it is essential to the skill or occupation.
- Be inclusive and culturally neutral.

### CONTEXT:
${enhancedPrompt}

### OUTPUT FORMAT:
Return a JSON array structured like this:

[{
  "stem": "Question text here?",
  "choices": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
  "correct_answer": "B",
  "explanation": "Brief explanation of why this is correct",
  "difficulty": "${proficiencyLevel}"
}]

Remember: Vary correct_answer between A, B, C, and D across the ${count} questions.`

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_EXTRACTOR || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('No content in OpenAI response')
  }

  // Parse JSON from response
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const questions: GeneratedQuestion[] = JSON.parse(cleanContent)

  // FORCE randomize answer keys to prevent AI bias (all B's issue)
  const answerKeys = ['A', 'B', 'C', 'D']
  questions.forEach((q, index) => {
    const currentCorrect = q.correct_answer
    const targetKey = answerKeys[index % 4] // Cycle through A, B, C, D
    
    if (currentCorrect !== targetKey) {
      // Swap the correct answer with target position
      const temp = q.choices[targetKey]
      q.choices[targetKey] = q.choices[currentCorrect]
      q.choices[currentCorrect] = temp
      q.correct_answer = targetKey
    }
  })

  return questions
}

/**
 * Create or update a SOC-based quiz with generated questions
 */
export async function createSocQuiz(socCode: string, companyId?: string, sessionId?: string): Promise<string> {
  console.log('Starting quiz creation for SOC:', socCode, 'company:', companyId)

  // Update progress: Creating quiz structure
  if (sessionId) {
    updateProgress(sessionId, {
      status: 'creating_structure',
      step: 3,
      totalSteps: 5,
      message: 'Creating quiz structure and sections...'
    })
  }

  // Check if standard quiz already exists
  const { data: existingQuiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('soc_code', socCode)
    .eq('is_standard', !companyId)
    .eq('company_id', companyId || null)
    .single()

  if (existingQuiz) {
    console.log('Quiz already exists:', existingQuiz.id)
    throw new Error(`Quiz already exists for SOC ${socCode}`)
  }

  console.log('No existing quiz found, proceeding with creation')

  console.log(`=== QUIZ GENERATION DEBUG FOR ${socCode} ===`)

  // REQUIRE SOC-specific skills - no fallbacks allowed
  // First get the job ID for this SOC code
  const { data: jobData, error: jobError } = await supabase
    .from('jobs')
    .select('id')
    .eq('soc_code', socCode)
    .limit(1)
    .single()

  console.log('Job lookup result:', { jobData, jobError })

  if (jobError || !jobData) {
    console.error('No job found for SOC code:', socCode)
    throw new Error(`No job found for SOC code ${socCode}. Cannot create quiz without a job.`)
  }

  console.log('Found job for SOC code:', jobData.id)

  // Now get skills for this job
  const { data: jobSkillsData, error: jobSkillsError } = await supabase
    .from('job_skills')
    .select(`
      job_id,
      skill_id,
      importance_level,
      proficiency_threshold,
      skills (
        id,
        name,
        category,
        description
      )
    `)
    .eq('job_id', jobData.id)

  console.log('Skills lookup result:', { 
    count: jobSkillsData?.length || 0, 
    error: jobSkillsError,
    hasData: !!jobSkillsData
  })

  if (jobSkillsError) {
    console.error('Job skills query error:', jobSkillsError)
    throw new Error(`Database error querying skills for SOC code ${socCode}: ${jobSkillsError.message}`)
  }

  if (!jobSkillsData || jobSkillsData.length === 0) {
    console.error('No skills found - jobSkillsData:', jobSkillsData)
    throw new Error(`No skills found for SOC code ${socCode}. Cannot create quiz without SOC-specific skills.`)
  }

  console.log('Found SOC-specific skills:', jobSkillsData.length)

  const jobSkills = jobSkillsData.map(item => ({
    skills: item.skills,
    importance_level: item.importance_level,
    proficiency_threshold: item.proficiency_threshold
  }))

  console.log(`Using ${jobSkills.length}SOC-specific skills for quiz creation`)

  // Create the quiz - match actual schema
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      job_id: jobData.id,
      estimated_minutes: 15,
      version: 1
    })
    .select()
    .single()

  if (quizError) {
    console.error('Quiz creation error:', quizError)
    throw quizError
  }

  console.log('Quiz created successfully:', quiz.id)

  // Create sections and generate questions for each skill
  let totalQuestions = 0

  for (let i = 0; i < jobSkills.length; i++) {
    const jobSkill = jobSkills[i] as any

    // Determine proficiency level based on threshold
    const proficiencyLevel = jobSkill.proficiency_threshold >= 85 ? 'expert' :
                           jobSkill.proficiency_threshold >= 70 ? 'intermediate' : 'beginner'

    console.log(`Creating section for skill: ${jobSkill.skills?.name} (${proficiencyLevel})`)

    // Create quiz section - match actual schema
      const { data: section, error: sectionError } = await supabase
        .from('quiz_sections')
        .insert({
          quiz_id: quiz.id,
          skill_id: jobSkill.skills?.id,
          order_index: i
        })
        .select()
        .single()

    if (sectionError) {
      console.error('Section creation error:', sectionError)
      throw sectionError
    }
    console.log('Section created successfully:', section.id)

    // Generate AI questions using OpenAI
    const questionCount = 5 // Generate 5 questions per skill
    console.log(`Generating ${questionCount} AI questions for skill: ${jobSkill.skills?.name}`)

    const questions = await generateSkillQuestions({
      socCode,
      skillId: jobSkill.skills?.id,
      skillName: jobSkill.skills?.name,
      proficiencyLevel: proficiencyLevel as any,
      questionCount,
      companyId
    })

    console.log(`Successfully generated ${questions.length} questions`)

    // Insert questions - match actual schema
    // Assign importance based on skill importance and question difficulty
    const skillImportance = jobSkill.importance_level === 'critical' ? 5.0 :
                           jobSkill.importance_level === 'important' ? 4.0 : 3.0
    
    const questionInserts = questions.map((q, idx) => {
      // Vary importance slightly based on difficulty
      // Expert questions get +0.5, beginner get -0.5 from base skill importance
      const difficultyAdjustment = q.difficulty === 'expert' ? 0.5 :
                                   q.difficulty === 'beginner' ? -0.5 : 0
      const questionImportance = Math.max(1.0, Math.min(5.0, skillImportance + difficultyAdjustment))
      
      return {
        section_id: section.id,
        stem: q.stem,
        choices: q.choices,
        answer_key: q.correct_answer, // Use answer_key instead of correct_answer
        difficulty: q.difficulty,
        importance: questionImportance // NEW: Question-level importance for weighting
      }
    })

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionInserts)

    if (questionsError) {
      console.error('Questions creation error:', questionsError)
      throw questionsError
    }

    console.log(`Created ${questions.length} questions for section`)

    // Update section with total question count - remove if column doesn't exist
    // await supabase
    //   .from('quiz_sections')
    //   .update({ total_questions: questions.length })
    //   .eq('id', section.id)

    totalQuestions += questions.length
  }

  // Update quiz with total question count and publish it - remove if columns don't exist
  // Quiz creation complete - total_questions column doesn't exist in current schema
  // Questions are counted via sections relationship

  console.log(`Quiz creation completed successfully with ${totalQuestions} total questions`)
  return quiz.id
}

/**
 * Select random questions for an assessment (rotation system)
 */
export async function selectAssessmentQuestions(quizId: string, userId: string): Promise<string[]> {
  // Get quiz sections
  const { data: sections } = await supabase
    .from('quiz_sections')
    .select('id, skill_id, questions_per_section')
    .eq('quiz_id', quizId)
    .order('order_index')

  if (!sections) return []

  const selectedQuestionIds: string[] = []

  for (const section of sections) {
    // Get questions for this skill/section, ordered by least recently used
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('id, usage_count, last_used_at')
      .eq('section_id', section.id)
      .eq('is_active', true)
      .order('usage_count', { ascending: true })
      .order('last_used_at', { ascending: true, nullsFirst: true })
      .limit(section.questions_per_section * 2) // Get more than needed for rotation

    if (!questions || questions.length < section.questions_per_section) {
      throw new Error(`Insufficient questions for skill ${section.skill_id}`)
    }

    // Randomly select the required number of questions
    const shuffled = questions.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, section.questions_per_section)

    selectedQuestionIds.push(...selected.map(q => q.id))
  }

  return selectedQuestionIds
}
