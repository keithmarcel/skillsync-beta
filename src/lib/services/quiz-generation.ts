// AI-powered quiz generation service for SOC-based assessments
// Generates reusable question pools per skill with rotation capabilities

import OpenAI from 'openai'
import { supabase } from '@/lib/supabase/client'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface QuizGenerationOptions {
  socCode: string
  skillId: string
  skillName: string
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert'
  questionCount: number // Typically 8-10 per skill for 40+ total pool
  companyId?: string // For custom company quizzes
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
        existingQuestions: questions // Avoid duplicates
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
  existingQuestions
}: {
  skill: any
  proficiencyLevel: string
  jobContext: string
  count: number
  existingQuestions: GeneratedQuestion[]
}): Promise<GeneratedQuestion[]> {

  const existingStems = existingQuestions.map(q => q.stem.toLowerCase())

  const prompt = `Generate ${count} multiple-choice questions testing ${skill.name} proficiency at the ${proficiencyLevel} level.

Skill Description: ${skill.description}
Proficiency Context: ${skill.proficiency_levels?.[proficiencyLevel] || 'Standard proficiency expectations'}

Real-world Context (example jobs):
${jobContext}

Requirements:
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer
- Questions should be practical and job-relevant
- Include a brief explanation for the correct answer
- Difficulty level: ${proficiencyLevel}
- Avoid these existing question stems: ${existingStems.slice(0, 5).join(', ')}

Return in this exact JSON format:
[{
  "stem": "Question text here?",
  "choices": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
  "correct_answer": "A",
  "explanation": "Brief explanation of why this is correct",
  "difficulty": "${proficiencyLevel}"
}]`

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_EXTRACTOR || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    const questions = JSON.parse(content)
    return questions
  } catch (error) {
    console.error('Failed to parse OpenAI response:', content)
    throw new Error('Invalid response format from OpenAI')
  }
}

/**
 * Create or update a SOC-based quiz with generated questions
 */
export async function createSocQuiz(socCode: string, companyId?: string): Promise<string> {
  // Check if standard quiz already exists
  const { data: existingQuiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('soc_code', socCode)
    .eq('is_standard', !companyId)
    .eq('company_id', companyId || null)
    .single()

  if (existingQuiz) {
    throw new Error(`Quiz already exists for SOC ${socCode}`)
  }

  // Get skills required for this SOC code
  const { data: jobSkills } = await supabase
    .from('job_skills')
    .select(`
      skill:skills(*),
      importance_level,
      proficiency_threshold
    `)
    .eq('job_id', (
      await supabase
        .from('jobs')
        .select('id')
        .eq('soc_code', socCode)
        .limit(1)
        .single()
    ).data?.id)

  if (!jobSkills || jobSkills.length === 0) {
    throw new Error(`No skills found for SOC code ${socCode}`)
  }

  // Create the quiz
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      soc_code: socCode,
      title: `${socCode} Skills Assessment`,
      description: `Comprehensive assessment of skills required for SOC code ${socCode}`,
      is_standard: !companyId,
      company_id: companyId,
      status: 'draft' // Will be published after question generation
    })
    .select()
    .single()

  if (quizError) throw quizError

  // Create sections and generate questions for each skill
  let totalQuestions = 0

  for (let i = 0; i < jobSkills.length; i++) {
    const jobSkill = jobSkills[i]
    const skill = jobSkill.skill

    // Determine proficiency level based on threshold
    const proficiencyLevel = jobSkill.proficiency_threshold >= 85 ? 'expert' :
                           jobSkill.proficiency_threshold >= 70 ? 'intermediate' : 'beginner'

    // Create quiz section
    const { data: section, error: sectionError } = await supabase
      .from('quiz_sections')
      .insert({
        quiz_id: quiz.id,
        skill_id: skill.id,
        title: skill.name,
        description: `Assessment of ${skill.name} proficiency`,
        questions_per_section: 5, // 5 questions per skill per assessment
        order_index: i
      })
      .select()
      .single()

    if (sectionError) throw sectionError

    // Generate 8-10 questions per skill (for 40+ total pool)
    const questionCount = 10
    const questions = await generateSkillQuestions({
      socCode,
      skillId: skill.id,
      skillName: skill.name,
      proficiencyLevel: proficiencyLevel as any,
      questionCount,
      companyId
    })

    // Insert questions
    const questionInserts = questions.map((q, idx) => ({
      section_id: section.id,
      skill_id: skill.id,
      stem: q.stem,
      choices: q.choices,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      points: 1
    }))

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionInserts)

    if (questionsError) throw questionsError

    // Update section with total question count
    await supabase
      .from('quiz_sections')
      .update({ total_questions: questionCount })
      .eq('id', section.id)

    totalQuestions += questionCount
  }

  // Update quiz with total question count and publish it
  await supabase
    .from('quizzes')
    .update({
      total_questions: totalQuestions,
      status: 'published'
    })
    .eq('id', quiz.id)

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
