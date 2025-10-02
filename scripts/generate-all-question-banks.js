/**
 * Automated Question Bank Generation
 * 
 * Generates comprehensive question banks for all standard occupations
 * Run this once to populate the question bank for the entire platform
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Validate environment
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not set');
  process.exit(1);
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not set');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use dynamic import for OpenAI (ESM module)
let openai;
async function initOpenAI() {
  const { default: OpenAI } = await import('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

// Configuration
const QUESTIONS_PER_SKILL = 12; // Generate 12 questions per skill
const DELAY_BETWEEN_SKILLS = 2000; // 2 seconds between API calls
const DELAY_BETWEEN_JOBS = 5000; // 5 seconds between jobs

/**
 * Generate AI questions for a skill
 */
async function generateAIQuestions(socCode, skillName, skillCategory, count) {
  const prompt = `Generate ${count} multiple-choice questions to assess "${skillName}" for ${socCode}.

Context:
- Skill: ${skillName}
- Category: ${skillCategory}
- Difficulty: Mix of beginner, intermediate, and expert

Requirements:
- Questions should test practical application
- Include realistic scenarios
- Each question has 4 options (A, B, C, D)
- Only ONE correct answer per question
- Brief explanation for correct answer
- AVOID repetitive questions - each must test different aspect
- Focus on INDIVIDUAL CONTRIBUTOR work, NOT management
- Relevant to entry-level to mid-level professionals

Return ONLY valid JSON array (no markdown):
[{
  "stem": "Question text here?",
  "choices": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
  "correct_answer": "B",
  "explanation": "Brief explanation",
  "difficulty": "intermediate"
}]`;

  try {
    if (!openai) {
      throw new Error('OpenAI not initialized');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert assessment designer. Create diverse, practical questions. Return valid JSON only.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8, // Higher for more variety
      max_tokens: 2000
    });

    const content = response.choices[0].message.content || '[]';
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let questions;
    try {
      questions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parse error:', cleanContent.substring(0, 200));
      throw parseError;
    }

    // Force randomize answer keys
    const answerKeys = ['A', 'B', 'C', 'D'];
    questions.forEach((q, index) => {
      const currentCorrect = q.correct_answer;
      const targetKey = answerKeys[index % 4];
      
      if (currentCorrect !== targetKey) {
        const temp = q.choices[targetKey];
        q.choices[targetKey] = q.choices[currentCorrect];
        q.choices[currentCorrect] = temp;
        q.correct_answer = targetKey;
      }
    });

    return questions;
  } catch (error) {
    console.error(`Error generating questions: ${error.message}`);
    return [];
  }
}

/**
 * Generate question bank for a single job
 */
async function generateQuestionBankForJob(job) {
  console.log(`\n📚 ${job.title} (${job.soc_code})`);

  // Get job skills
  const { data: jobSkills } = await supabase
    .from('job_skills')
    .select('*, skills(*)')
    .eq('job_id', job.id)
    .order('importance_level', { ascending: true }); // critical first

  if (!jobSkills || jobSkills.length === 0) {
    console.log('  ⚠️  No skills found');
    return { success: false, questionsGenerated: 0 };
  }

  console.log(`  Found ${jobSkills.length} skills`);

  let totalQuestions = 0;

  for (const jobSkill of jobSkills) {
    const skill = jobSkill.skills;

    try {
      process.stdout.write(`  ${skill.name}... `);

      // Check if questions already exist
      const { count: existingCount } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true })
        .eq('skill_id', skill.id)
        .eq('is_bank_question', true);

      if (existingCount >= QUESTIONS_PER_SKILL) {
        console.log(`✅ ${existingCount} (exists)`);
        totalQuestions += existingCount;
        continue;
      }

      // Generate questions
      const questions = await generateAIQuestions(
        job.soc_code,
        skill.name,
        skill.category,
        QUESTIONS_PER_SKILL
      );

      if (questions.length === 0) {
        console.log('❌');
        continue;
      }

      // Save to database
      const questionRecords = questions.map(q => ({
        skill_id: skill.id,
        stem: q.stem,
        choices: q.choices,
        answer_key: q.correct_answer,
        difficulty: q.difficulty,
        importance: jobSkill.importance_level === 'critical' ? 5.0 :
                   jobSkill.importance_level === 'important' ? 4.0 : 3.0,
        is_bank_question: true,
        times_used: 0
      }));

      const { error } = await supabase
        .from('quiz_questions')
        .insert(questionRecords);

      if (error) {
        console.log(`❌ ${error.message}`);
      } else {
        console.log(`✅ ${questions.length}`);
        totalQuestions += questions.length;
      }

      // Delay between skills to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_SKILLS));

    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
  }

  console.log(`  Total: ${totalQuestions} questions`);

  return {
    success: true,
    questionsGenerated: totalQuestions
  };
}

/**
 * Main function: Generate question banks for all standard occupations
 */
async function generateAllQuestionBanks() {
  console.log('\n🚀 AUTOMATED QUESTION BANK GENERATION');
  console.log('═══════════════════════════════════════════════════\n');

  // Get all standard occupations
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, soc_code, title')
    .eq('job_kind', 'occupation')
    .not('soc_code', 'is', null)
    .order('title');

  if (!jobs || jobs.length === 0) {
    console.log('❌ No jobs found');
    return;
  }

  console.log(`Found ${jobs.length} standard occupations\n`);

  let successCount = 0;
  let totalQuestions = 0;
  const startTime = Date.now();

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    
    console.log(`[${i + 1}/${jobs.length}]`);
    
    const result = await generateQuestionBankForJob(job);
    
    if (result.success) {
      successCount++;
      totalQuestions += result.questionsGenerated;
    }

    // Delay between jobs
    if (i < jobs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_JOBS));
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000 / 60);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ GENERATION COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Occupations processed: ${successCount}/${jobs.length}`);
  console.log(`Total questions generated: ${totalQuestions}`);
  console.log(`Average per occupation: ${Math.round(totalQuestions / successCount)}`);
  console.log(`Time taken: ${duration} minutes`);
  console.log('═══════════════════════════════════════════════════\n');
}

// Run with proper initialization and error handling
(async () => {
  try {
    console.log('🔧 Initializing OpenAI...');
    await initOpenAI();
    console.log('✅ OpenAI initialized\n');
    
    await generateAllQuestionBanks();
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
})();
