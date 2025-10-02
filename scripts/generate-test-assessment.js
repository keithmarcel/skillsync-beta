/**
 * Generate Test Assessment
 * 
 * Creates a test assessment using dynamic assembly from question bank
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_SOC_CODE = '15-1252.00'; // Software Developers

async function generateTestAssessment() {
  console.log('\n🎯 GENERATING TEST ASSESSMENT\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Get test user
  const { data: users } = await supabase.auth.admin.listUsers();
  const testUser = users.users[0];
  
  if (!testUser) {
    console.log('❌ No users found. Create a user first.');
    return;
  }

  console.log(`✅ Test User: ${testUser.email}`);

  // Get Software Developers job
  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, soc_code')
    .eq('soc_code', TEST_SOC_CODE)
    .single();

  if (!job) {
    console.log('❌ Job not found');
    return;
  }

  console.log(`✅ Job: ${job.title} (${job.soc_code})`);

  // Get top 7 critical/important skills
  const { data: jobSkills } = await supabase
    .from('job_skills')
    .select('*, skills(*)')
    .eq('job_id', job.id)
    .in('importance_level', ['critical', 'important'])
    .order('importance_level', { ascending: true })
    .order('weight', { ascending: false })
    .limit(7);

  console.log(`✅ Selected ${jobSkills.length} top skills\n`);

  // Get 3 random questions per skill
  const allQuestions = [];
  
  for (const jobSkill of jobSkills) {
    const skill = jobSkill.skills;
    
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('skill_id', skill.id)
      .eq('is_bank_question', true)
      .limit(20); // Get 20, pick 3 random

    if (questions && questions.length > 0) {
      // Shuffle and take 3
      const shuffled = questions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 3);
      
      console.log(`  ${skill.name}: ${selected.length} questions`);
      
      allQuestions.push(...selected.map(q => ({
        ...q,
        skill_name: skill.name,
        skill_importance: jobSkill.importance_level,
        skill_weight: jobSkill.weight
      })));
    }
  }

  console.log(`\n✅ Total questions assembled: ${allQuestions.length}`);

  // Create assessment (minimal fields to avoid schema cache issues)
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .insert({
      user_id: testUser.id,
      job_id: job.id,
      method: 'quiz' // Required field - valid enum: 'quiz' or 'resume'
    })
    .select()
    .single();

  if (assessmentError) {
    console.log('❌ Error creating assessment:', assessmentError.message);
    return;
  }

  console.log(`✅ Assessment created: ${assessment.id}`);

  // Simulate answering questions (mix of correct/incorrect)
  console.log('\n📝 Simulating answers...\n');

  for (let i = 0; i < allQuestions.length; i++) {
    const question = allQuestions[i];
    
    // Simulate 70% correct rate
    const isCorrect = Math.random() < 0.7;
    const selectedAnswer = isCorrect ? question.answer_key : 
      ['A', 'B', 'C', 'D'].find(k => k !== question.answer_key);

    await supabase
      .from('assessment_responses')
      .insert({
        assessment_id: assessment.id,
        question_id: question.id,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        time_spent_seconds: Math.floor(Math.random() * 60) + 30
      });

    console.log(`  Q${i + 1}: ${question.skill_name} - ${isCorrect ? '✅' : '❌'}`);
  }

  // Calculate skill scores
  console.log('\n📊 Calculating skill scores...\n');

  const skillScores = {};
  
  for (const jobSkill of jobSkills) {
    const skill = jobSkill.skills;
    
    // Get responses for this skill
    const skillQuestions = allQuestions.filter(q => q.skill_id === skill.id);
    const { data: responses } = await supabase
      .from('assessment_responses')
      .select('*')
      .eq('assessment_id', assessment.id)
      .in('question_id', skillQuestions.map(q => q.id));

    if (responses && responses.length > 0) {
      const correct = responses.filter(r => r.is_correct).length;
      const total = responses.length;
      const scorePct = Math.round((correct / total) * 100);

      skillScores[skill.id] = {
        skill_name: skill.name,
        correct,
        total,
        score_pct: scorePct,
        importance: jobSkill.importance_level,
        weight: jobSkill.weight
      };

      // Save to database
      await supabase
        .from('assessment_skill_results')
        .insert({
          assessment_id: assessment.id,
          skill_id: skill.id,
          questions_answered: total,
          questions_correct: correct,
          score_pct: scorePct,
          proficiency_level: scorePct >= 80 ? 'proficient' : 
                            scorePct >= 60 ? 'developing' : 'needs_improvement'
        });

      console.log(`  ${skill.name}: ${correct}/${total} (${scorePct}%) - ${jobSkill.importance_level}`);
    }
  }

  // Calculate overall weighted score
  let weightedScore = 0;
  let totalWeight = 0;

  for (const [skillId, result] of Object.entries(skillScores)) {
    const weight = result.weight || 0.5;
    const importanceMultiplier = result.importance === 'critical' ? 1.5 : 
                                 result.importance === 'important' ? 1.2 : 1.0;
    
    const skillWeight = weight * importanceMultiplier;
    weightedScore += (result.score_pct / 100) * skillWeight;
    totalWeight += skillWeight;
  }

  const overallScore = Math.round((weightedScore / totalWeight) * 100);

  console.log(`\n📈 Overall Weighted Score: ${overallScore}%`);

  // Update assessment (only fields that exist)
  await supabase
    .from('assessments')
    .update({
      analyzed_at: new Date().toISOString()
    })
    .eq('id', assessment.id);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ TEST ASSESSMENT COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Assessment ID: ${assessment.id}`);
  console.log(`User: ${testUser.email}`);
  console.log(`Job: ${job.title}`);
  console.log(`Questions: ${allQuestions.length}`);
  console.log(`Overall Score: ${overallScore}%`);
  console.log(`Skills Tested: ${Object.keys(skillScores).length}`);
  console.log('═══════════════════════════════════════════════════\n');

  return assessment.id;
}

generateTestAssessment().catch(console.error);
