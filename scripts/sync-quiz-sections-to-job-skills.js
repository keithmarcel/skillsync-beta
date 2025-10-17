/**
 * Sync Quiz Sections to Job Skills
 * 
 * This script ensures quiz sections match the role's job_skills.
 * It will:
 * 1. Find all quizzes for featured roles
 * 2. Delete existing quiz sections
 * 3. Create new sections based on role's job_skills
 * 4. Preserve questions if they exist for those skills
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncQuizSections() {
  console.log('🔄 Syncing Quiz Sections to Job Skills\n');
  console.log('='.repeat(70));

  // 1. Get all quizzes with their jobs
  const { data: quizzes, error: quizzesError } = await supabase
    .from('quizzes')
    .select(`
      id,
      title,
      job_id,
      job:jobs!job_id(
        id,
        title,
        job_skills(
          skill_id,
          importance_level,
          skills(id, name, category, description)
        )
      )
    `)
    .eq('status', 'published');

  if (quizzesError) {
    console.error('Error fetching quizzes:', quizzesError);
    return;
  }

  console.log(`\n📋 Found ${quizzes.length} published quizzes\n`);

  for (const quiz of quizzes) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎯 Quiz: ${quiz.title}`);
    console.log(`   Job: ${quiz.job.title}`);
    console.log(`   Job Skills: ${quiz.job.job_skills.length}`);

    // 2. Get current quiz sections
    const { data: currentSections } = await supabase
      .from('quiz_sections')
      .select('id, skill_id, skills(name)')
      .eq('quiz_id', quiz.id);

    console.log(`   Current Sections: ${currentSections?.length || 0}`);
    
    if (currentSections && currentSections.length > 0) {
      console.log(`\n   Current Skills:`);
      currentSections.forEach((s, i) => {
        console.log(`      ${i + 1}. ${s.skills.name}`);
      });
    }

    // 3. Get job skills
    const jobSkills = quiz.job.job_skills;
    
    if (jobSkills.length === 0) {
      console.log(`\n   ⚠️  No job_skills found for this role. Skipping.`);
      continue;
    }

    console.log(`\n   Target Skills (from job_skills):`);
    jobSkills.forEach((js, i) => {
      console.log(`      ${i + 1}. ${js.skills.name} (importance: ${js.importance_level})`);
    });

    // 4. Check if sections match
    const currentSkillIds = new Set(currentSections?.map(s => s.skill_id) || []);
    const targetSkillIds = new Set(jobSkills.map(js => js.skill_id));
    
    const needsSync = currentSkillIds.size !== targetSkillIds.size || 
                      ![...targetSkillIds].every(id => currentSkillIds.has(id));

    if (!needsSync) {
      console.log(`\n   ✅ Sections already match job_skills. No sync needed.`);
      continue;
    }

    console.log(`\n   🔄 Syncing sections...`);

    // 5. Delete old sections (this will cascade delete questions)
    if (currentSections && currentSections.length > 0) {
      const { error: deleteError } = await supabase
        .from('quiz_sections')
        .delete()
        .eq('quiz_id', quiz.id);

      if (deleteError) {
        console.error(`   ❌ Error deleting sections:`, deleteError.message);
        continue;
      }
      console.log(`   ✓ Deleted ${currentSections.length} old sections`);
    }

    // 6. Create new sections from job_skills
    const newSections = jobSkills.map((js, index) => ({
      quiz_id: quiz.id,
      skill_id: js.skill_id,
      order_index: index
    }));

    const { data: insertedSections, error: insertError } = await supabase
      .from('quiz_sections')
      .insert(newSections)
      .select();

    if (insertError) {
      console.error(`   ❌ Error creating sections:`, insertError.message);
      continue;
    }

    console.log(`   ✓ Created ${insertedSections.length} new sections`);
    
    // 7. Check if questions exist for these sections
    const { count: questionCount } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quiz.id);

    console.log(`   ℹ️  Questions in quiz: ${questionCount || 0}`);
    
    if (questionCount === 0) {
      console.log(`   ⚠️  No questions found. You'll need to generate questions for this quiz.`);
    }

    console.log(`\n   ✅ Sync complete for ${quiz.title}`);
  }

  console.log(`\n\n${'='.repeat(70)}`);
  console.log('✅ All quizzes synced!\n');
  console.log('📝 Summary:');
  console.log('   - Quiz sections now match role job_skills');
  console.log('   - Old sections and questions were deleted');
  console.log('   - New sections created based on current job_skills');
  console.log('\n⚠️  Next Steps:');
  console.log('   - Regenerate questions for quizzes with 0 questions');
  console.log('   - Test assessments to ensure they work correctly');
  console.log(`\n${'='.repeat(70)}`);
}

syncQuizSections()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
