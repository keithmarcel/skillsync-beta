/**
 * Seed analytics data for Power Design assessments
 * Creates realistic assessment attempts with varying proficiency levels
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use actual demo users with avatars for realistic analytics
const demoUsers = [
  { id: '3bcfef07-2c6b-4f3f-9c0f-8e5a4d3b2c1a', name: 'Naomi Blake', proficiency: 'high' },
  { id: '00f89334-5e6d-4a2b-8c9f-1a2b3c4d5e6f', name: 'Elias Thorne', proficiency: 'high' },
  { id: '269391cb-7f8e-4b3c-9d0e-2b3c4d5e6f7a', name: 'Emanuel Highgate', proficiency: 'high' },
  { id: 'b25fed7f-8a9b-4c5d-9e0f-3c4d5e6f7a8b', name: 'Aaliyah Ramirez', proficiency: 'medium' },
  { id: '61533338-9b0c-4d6e-9f1a-4d5e6f7a8b9c', name: 'Fatima Nguyen', proficiency: 'medium' },
  { id: '8ddf2dc3-b6c0-4000-8a30-86d814429049', name: 'Sarah Mitchell', proficiency: 'medium' },
];

function getReadinessScore(proficiency) {
  if (proficiency === 'high') return 85 + Math.random() * 15; // 85-100%
  if (proficiency === 'medium') return 70 + Math.random() * 15; // 70-85%
  return 50 + Math.random() * 20; // 50-70%
}

function getStatusTag(readiness) {
  if (readiness >= 85) return 'role_ready';
  if (readiness >= 70) return 'close_gaps';
  return 'build_foundation';
}

async function seedAnalytics() {
  console.log('🌱 Seeding assessment analytics data...\n');

  try {
    // Get all Power Design quizzes
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, title, job_id')
      .eq('company_id', 'e5848012-89df-449e-855a-1834e9389656');

    if (!quizzes || quizzes.length === 0) {
      console.log('❌ No Power Design quizzes found');
      return;
    }

    console.log(`Found ${quizzes.length} quizzes\n`);

    for (const quiz of quizzes) {
      console.log(`📊 Seeding analytics for: ${quiz.title}`);

      // Get quiz questions for response data
      const { data: sections } = await supabase
        .from('quiz_sections')
        .select('id, skill_id')
        .eq('quiz_id', quiz.id);

      if (!sections || sections.length === 0) {
        console.log('   ⚠️ No sections found, skipping...\n');
        continue;
      }

      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, section_id, answer_key')
        .in('section_id', sections.map(s => s.id));

      if (!questions || questions.length === 0) {
        console.log('   ⚠️ No questions found, skipping...\n');
        continue;
      }

      // Create assessments for demo users
      const selectedUsers = demoUsers.slice(0, Math.min(6, demoUsers.length));

      for (const user of selectedUsers) {
        const readiness = getReadinessScore(user.proficiency);
        const statusTag = getStatusTag(readiness);

        // Create assessment
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .insert({
            user_id: user.id,
            quiz_id: quiz.id,
            job_id: quiz.job_id,
            method: 'quiz', // Required field
            readiness_pct: Math.round(readiness * 100) / 100,
            status_tag: statusTag,
            analyzed_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
          })
          .select()
          .single();

        if (assessmentError) {
          console.error(`   ❌ Error creating assessment:`, assessmentError.message);
          continue;
        }

        // Create quiz responses for each question
        const responses = questions.map(q => {
          // Determine if answer is correct based on proficiency
          let isCorrect;
          if (user.proficiency === 'high') {
            isCorrect = Math.random() > 0.1; // 90% correct
          } else if (user.proficiency === 'medium') {
            isCorrect = Math.random() > 0.25; // 75% correct
          } else {
            isCorrect = Math.random() > 0.4; // 60% correct
          }

          const choices = ['A', 'B', 'C', 'D'];
          const selected = isCorrect ? q.answer_key : choices[Math.floor(Math.random() * choices.length)];

          return {
            assessment_id: assessment.id,
            question_id: q.id,
            selected: selected,
            is_correct: isCorrect
          };
        });

        const { error: responsesError } = await supabase
          .from('quiz_responses')
          .insert(responses);

        if (responsesError) {
          console.error(`   ❌ Error creating responses:`, responsesError.message);
        } else {
          console.log(`   ✅ ${user.name}: ${Math.round(readiness)}% (${statusTag})`);
        }

        // Create skill scores
        const skillScores = sections.map(section => {
          const sectionQuestions = questions.filter(q => q.section_id === section.id);
          const sectionResponses = responses.filter(r => 
            sectionQuestions.some(q => q.id === r.question_id)
          );
          const correctCount = sectionResponses.filter(r => r.is_correct).length;
          const score = sectionQuestions.length > 0 
            ? (correctCount / sectionQuestions.length) * 100 
            : 0;

          return {
            assessment_id: assessment.id,
            skill_id: section.skill_id,
            score: Math.round(score * 100) / 100,
            total_questions: sectionQuestions.length,
            correct_answers: correctCount
          };
        });

        const { error: scoresError } = await supabase
          .from('assessment_skill_scores')
          .insert(skillScores);

        if (scoresError) {
          console.error(`   ⚠️ Skill scores error (may not exist yet):`, scoresError.message);
        }
      }

      console.log(`   📈 Created ${selectedUsers.length} assessments\n`);
    }

    console.log('✅ Analytics seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - ${quizzes.length} quizzes with analytics`);
    console.log(`   - ${demoUsers.length} demo users with avatars`);
    console.log(`   - Proficiency distribution: High (3), Medium (3)`);
    console.log(`   - Assessments taken over last 7 days\n`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

seedAnalytics()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
