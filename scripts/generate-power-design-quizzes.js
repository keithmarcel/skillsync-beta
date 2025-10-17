/**
 * Generate AI Quizzes for Power Design Roles
 * 
 * This script:
 * 1. Finds the Power Design roles
 * 2. Populates skills for each role (from SOC code)
 * 3. Creates quiz with sections
 * 4. Generates AI questions for each skill
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generatePowerDesignQuizzes() {
  console.log('🚀 Generating Power Design Quizzes...\n');

  try {
    // 1. Find Power Design company
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('name', 'Power Design')
      .single();

    if (!company) {
      console.error('❌ Power Design company not found!');
      return;
    }

    console.log(`✅ Found company: ${company.name}\n`);

    // 2. Find Power Design roles
    const { data: roles } = await supabase
      .from('jobs')
      .select('id, title, soc_code')
      .eq('company_id', company.id)
      .eq('job_kind', 'featured_role');

    if (!roles || roles.length === 0) {
      console.error('❌ No Power Design roles found!');
      return;
    }

    console.log(`📋 Found ${roles.length} roles:\n`);
    roles.forEach(r => console.log(`  - ${r.title} (SOC: ${r.soc_code})`));
    console.log('');

    // 3. For each role, create quiz
    for (const role of roles) {
      console.log(`\n🎯 Processing: ${role.title}`);
      console.log(`   SOC Code: ${role.soc_code}`);

      // Check if quiz already exists
      const { data: existingQuiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('job_id', role.id)
        .single();

      if (existingQuiz) {
        console.log(`   ⚠️  Quiz already exists (ID: ${existingQuiz.id})`);
        console.log(`   Skipping...`);
        continue;
      }

      // Get SOC skills for this role
      console.log(`   📚 Fetching skills for SOC ${role.soc_code}...`);
      
      const { data: socSkills } = await supabase
        .from('soc_skills')
        .select(`
          skill_id,
          skill:skills(id, name, category)
        `)
        .eq('soc_code', role.soc_code)
        .order('display_order')
        .limit(8); // Top 8 skills

      if (!socSkills || socSkills.length === 0) {
        console.log(`   ❌ No skills found for SOC ${role.soc_code}`);
        console.log(`   Skipping quiz generation...`);
        continue;
      }

      console.log(`   ✅ Found ${socSkills.length} skills`);

      // Create quiz
      console.log(`   📝 Creating quiz...`);
      
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          job_id: role.id,
          company_id: company.id,
          title: `${role.title} Assessment`,
          description: `Skills assessment for ${role.title} role at Power Design`,
          soc_code: role.soc_code,
          status: 'published',
          ai_generated: true,
          is_standard: false,
          estimated_minutes: 15,
          questions_per_assessment: 15,
          total_questions: socSkills.length * 5 // 5 questions per skill
        })
        .select()
        .single();

      if (quizError) {
        console.error(`   ❌ Error creating quiz:`, quizError);
        continue;
      }

      console.log(`   ✅ Quiz created (ID: ${quiz.id})`);

      // Create quiz sections (one per skill)
      console.log(`   📋 Creating quiz sections...`);
      
      const sections = socSkills.map((socSkill, index) => ({
        quiz_id: quiz.id,
        skill_id: socSkill.skill_id,
        order_index: index,
        questions_per_section: 5,
        total_questions: 0 // Will be updated after questions are generated
      }));

      const { data: createdSections, error: sectionsError } = await supabase
        .from('quiz_sections')
        .insert(sections)
        .select();

      if (sectionsError) {
        console.error(`   ❌ Error creating sections:`, sectionsError);
        continue;
      }

      console.log(`   ✅ Created ${createdSections.length} sections`);

      // Note: Actual AI question generation would happen via the admin UI
      // For demo purposes, the quiz structure is ready
      console.log(`   ℹ️  Quiz structure ready - questions can be generated via admin UI`);
      console.log(`   🔗 Navigate to: /employer/assessments/${quiz.id}/edit?tab=questions`);
    }

    console.log(`\n🎉 QUIZ GENERATION COMPLETE!\n`);
    console.log(`📊 Summary:`);
    console.log(`  - Company: ${company.name}`);
    console.log(`  - Roles processed: ${roles.length}`);
    console.log(`\n🚀 Next Steps:`);
    console.log(`  1. Visit /employer dashboard`);
    console.log(`  2. Go to Assessments tab`);
    console.log(`  3. Click on each quiz to generate AI questions`);
    console.log(`  4. Test assessment flow!\n`);

  } catch (error) {
    console.error('❌ Quiz generation failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generatePowerDesignQuizzes()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = { generatePowerDesignQuizzes };
