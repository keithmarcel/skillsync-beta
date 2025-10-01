/**
 * Question Bank Service
 * 
 * Manages dynamic assessment assembly with anti-cheating features:
 * - Generate comprehensive question banks (10-15 questions per skill)
 * - Select top critical/important skills for assessments
 * - Random question sampling with anti-repeat logic
 * - Track question usage and user history
 */

import { createClient } from '@supabase/supabase-js'
import { generateAIQuestions } from './quiz-generation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Skill {
  id: string
  name: string
  category: string
  importance_level: 'critical' | 'important' | 'helpful'
  weight: number
}

interface QuestionBankOptions {
  questionsPerSkill?: number
  includeAllSkills?: boolean
}

/**
 * Generate comprehensive question bank for a job
 * Creates 10-15 questions per skill for later random selection
 */
export async function generateQuestionBank(
  jobId: string,
  socCode: string,
  options: QuestionBankOptions = {}
): Promise<{ success: boolean; totalQuestions: number; skillsProcessed: number }> {
  
  const { questionsPerSkill = 12, includeAllSkills = true } = options

  console.log(`\n📚 Generating question bank for job ${jobId}`)

  // Get job skills
  const { data: jobSkills } = await supabase
    .from('job_skills')
    .select('*, skills(*)')
    .eq('job_id', jobId)
    .order('importance_level', { ascending: true }) // critical first

  if (!jobSkills || jobSkills.length === 0) {
    throw new Error('No skills found for job')
  }

  console.log(`  Found ${jobSkills.length} skills`)

  let totalQuestions = 0
  let skillsProcessed = 0

  for (const jobSkill of jobSkills) {
    const skill = jobSkill.skills

    try {
      console.log(`  Generating ${questionsPerSkill} questions for: ${skill.name}`)

      // Generate questions using AI
      const questions = await generateAIQuestions(
        socCode,
        skill.name,
        skill.category,
        {
          importance: jobSkill.importance_level === 'critical' ? 4.5 :
                     jobSkill.importance_level === 'important' ? 3.5 : 2.5,
          difficultyLevel: 'intermediate' // Mix of difficulties
        },
        questionsPerSkill
      )

      // Save to database with bank metadata
      for (const question of questions) {
        const { error } = await supabase
          .from('quiz_questions')
          .insert({
            skill_id: skill.id,
            stem: question.stem,
            choices: question.choices,
            answer_key: question.correct_answer,
            difficulty: question.difficulty,
            importance: jobSkill.importance_level === 'critical' ? 5.0 :
                       jobSkill.importance_level === 'important' ? 4.0 : 3.0,
            is_bank_question: true, // Mark as bank question
            times_used: 0
          })

        if (!error) totalQuestions++
      }

      skillsProcessed++
      console.log(`    ✅ ${questions.length} questions generated`)

    } catch (error) {
      console.error(`    ❌ Error generating questions for ${skill.name}:`, error)
    }
  }

  console.log(`\n✅ Question bank complete: ${totalQuestions} questions across ${skillsProcessed} skills`)

  return {
    success: true,
    totalQuestions,
    skillsProcessed
  }
}

/**
 * Select top skills for assessment (critical + important only)
 */
export async function selectTopSkills(jobId: string, maxSkills: number = 7): Promise<Skill[]> {
  const { data: jobSkills } = await supabase
    .from('job_skills')
    .select('*, skills(*)')
    .eq('job_id', jobId)
    .in('importance_level', ['critical', 'important'])
    .order('importance_level', { ascending: true }) // critical first
    .order('weight', { ascending: false }) // then by weight
    .limit(maxSkills)

  return jobSkills?.map(js => ({
    id: js.skills.id,
    name: js.skills.name,
    category: js.skills.category,
    importance_level: js.importance_level,
    weight: js.weight
  })) || []
}

/**
 * Get random questions from bank for a skill
 * Excludes questions user has seen recently
 */
export async function getRandomQuestionsForSkill(
  skillId: string,
  count: number,
  userId?: string,
  excludeDays: number = 30
): Promise<any[]> {
  
  // Get questions user has seen recently
  let excludeIds: string[] = []
  if (userId) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - excludeDays)

    const { data: history } = await supabase
      .from('user_question_history')
      .select('question_id')
      .eq('user_id', userId)
      .gte('seen_at', cutoffDate.toISOString())

    excludeIds = history?.map(h => h.question_id) || []
  }

  // Get random questions from bank
  let query = supabase
    .from('quiz_questions')
    .select('*')
    .eq('skill_id', skillId)
    .eq('is_bank_question', true)

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  // PostgreSQL random sampling
  const { data: allQuestions } = await query

  if (!allQuestions || allQuestions.length === 0) {
    return []
  }

  // Shuffle and take count
  const shuffled = allQuestions.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/**
 * Assemble dynamic assessment from question bank
 * Selects top skills and random questions for each
 */
export async function assembleDynamicAssessment(
  jobId: string,
  userId?: string,
  options: {
    maxSkills?: number
    questionsPerSkill?: number
    targetTotal?: number
  } = {}
): Promise<{
  skills: Skill[]
  questions: any[]
  totalQuestions: number
}> {
  
  const {
    maxSkills = 7,
    questionsPerSkill = 3,
    targetTotal = 25
  } = options

  console.log(`\n🎯 Assembling dynamic assessment for job ${jobId}`)

  // Step 1: Select top skills
  const topSkills = await selectTopSkills(jobId, maxSkills)
  console.log(`  Selected ${topSkills.length} top skills`)

  if (topSkills.length === 0) {
    throw new Error('No skills available for assessment')
  }

  // Step 2: Get random questions for each skill
  const allQuestions = []
  
  for (const skill of topSkills) {
    const questions = await getRandomQuestionsForSkill(
      skill.id,
      questionsPerSkill,
      userId
    )

    console.log(`  ${skill.name}: ${questions.length} questions`)
    
    allQuestions.push(...questions.map(q => ({
      ...q,
      skill_name: skill.name,
      skill_importance: skill.importance_level
    })))
  }

  // Step 3: Trim to target total if needed
  const finalQuestions = allQuestions.slice(0, targetTotal)

  console.log(`\n✅ Assessment assembled: ${finalQuestions.length} questions from ${topSkills.length} skills`)

  return {
    skills: topSkills,
    questions: finalQuestions,
    totalQuestions: finalQuestions.length
  }
}

/**
 * Record that user saw these questions
 */
export async function recordQuestionHistory(
  userId: string,
  assessmentId: string,
  questionIds: string[]
): Promise<void> {
  
  const records = questionIds.map(qid => ({
    user_id: userId,
    question_id: qid,
    assessment_id: assessmentId,
    seen_at: new Date().toISOString()
  }))

  await supabase
    .from('user_question_history')
    .insert(records)

  // Update question usage stats
  for (const qid of questionIds) {
    await supabase.rpc('increment_question_usage', { question_id: qid })
  }
}

/**
 * Get question bank statistics
 */
export async function getQuestionBankStats(jobId: string): Promise<{
  totalQuestions: number
  bySkill: Record<string, number>
  avgQuestionsPerSkill: number
}> {
  
  const { data: skills } = await supabase
    .from('job_skills')
    .select('skill_id, skills(name)')
    .eq('job_id', jobId)

  const bySkill: Record<string, number> = {}
  let totalQuestions = 0

  for (const skill of skills || []) {
    const { count } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true })
      .eq('skill_id', skill.skill_id)
      .eq('is_bank_question', true)

    bySkill[skill.skills.name] = count || 0
    totalQuestions += count || 0
  }

  return {
    totalQuestions,
    bySkill,
    avgQuestionsPerSkill: totalQuestions / (skills?.length || 1)
  }
}
