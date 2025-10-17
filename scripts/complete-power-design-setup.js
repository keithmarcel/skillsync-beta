/**
 * Complete Power Design Demo Setup
 * 
 * Uses our existing AI pipeline to:
 * 1. Extract skills using AI
 * 2. Save skills to database
 * 3. Link skills to jobs
 * 4. Update quiz sections
 * 5. Generate AI questions
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COMPANY_ID = 'e5848012-89df-449e-855a-1834e9389656';

async function completeSetup() {
  console.log('🚀 Complete Power Design Demo Setup\n');
  console.log('Using AI Pipeline to populate everything!\n');

  try {
    // Get the 2 demo roles
    const { data: roles } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', COMPANY_ID)
      .in('title', ['Assistant Property Manager', 'Business Process Engineer']);

    console.log(`Found ${roles.length} roles to process\n`);

    for (const role of roles) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 Processing: ${role.title}`);
      console.log(`${'='.repeat(60)}\n`);

      // STEP 1: Extract skills using AI
      console.log('STEP 1: Extracting skills with AI...');
      const extractResponse = await fetch('http://localhost:3000/api/admin/skills-extractor/soc-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socCode: role.soc_code,
          jobTitle: role.title,
          jobDescription: role.long_desc
        })
      });

      const extractResult = await extractResponse.json();
      const skills = extractResult.extractedSkills || [];
      
      console.log(`✅ Extracted ${skills.length} skills\n`);

      // STEP 2: Save skills to database and link to job
      console.log('STEP 2: Saving skills to database...');
      
      for (const skillData of skills.slice(0, 8)) { // Top 8 skills
        // Check if skill exists
        let { data: existingSkill } = await supabase
          .from('skills')
          .select('id')
          .eq('name', skillData.skill)
          .single();

        let skillId;
        
        if (existingSkill) {
          skillId = existingSkill.id;
        } else {
          // Create new skill
          const { data: newSkill } = await supabase
            .from('skills')
            .insert({
              name: skillData.skill,
              description: skillData.description,
              category: 'Professional',
              source: 'OPENAI',
              is_assessable: true,
              curation_status: skillData.curation_status
            })
            .select()
            .single();
          
          skillId = newSkill.id;
        }

        // Link skill to job
        await supabase
          .from('job_skills')
          .upsert({
            job_id: role.id,
            skill_id: skillId,
            importance_level: Math.min(5, Math.ceil(skillData.confidence / 20))
          }, { onConflict: 'job_id,skill_id' });
      }

      console.log(`✅ Saved and linked ${skills.slice(0, 8).length} skills\n`);

      // STEP 3: Get or create quiz
      console.log('STEP 3: Setting up quiz...');
      
      let { data: quiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('job_id', role.id)
        .single();

      if (!quiz) {
        const { data: newQuiz } = await supabase
          .from('quizzes')
          .insert({
            job_id: role.id,
            company_id: COMPANY_ID,
            title: `${role.title} Assessment`,
            description: `Skills assessment for ${role.title} role at Power Design`,
            soc_code: role.soc_code,
            status: 'published',
            ai_generated: true,
            estimated_minutes: 15,
            questions_per_assessment: 15
          })
          .select()
          .single();
        
        quiz = newQuiz;
      }

      console.log(`✅ Quiz ready (ID: ${quiz.id})\n`);

      // STEP 4: Create quiz sections for each skill
      console.log('STEP 4: Creating quiz sections...');
      
      const { data: jobSkills } = await supabase
        .from('job_skills')
        .select('skill_id, skill:skills(id, name)')
        .eq('job_id', role.id)
        .limit(8);

      // Delete existing sections first
      await supabase
        .from('quiz_sections')
        .delete()
        .eq('quiz_id', quiz.id);

      // Create new sections
      const sections = jobSkills.map((js, i) => ({
        quiz_id: quiz.id,
        skill_id: js.skill_id,
        order_index: i,
        questions_per_section: 5
      }));

      await supabase
        .from('quiz_sections')
        .insert(sections);

      console.log(`✅ Created ${sections.length} quiz sections\n`);

      // STEP 5: Generate AI questions for each section
      console.log('STEP 5: Generating AI questions...');
      
      const { data: quizSections } = await supabase
        .from('quiz_sections')
        .select('id, skill:skills(id, name, category)')
        .eq('quiz_id', quiz.id);

      let totalQuestions = 0;

      for (const section of quizSections) {
        console.log(`  🔹 ${section.skill.name}...`);
        
        const genResponse = await fetch('http://localhost:3000/api/admin/quizzes/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skillId: section.skill.id,
            skillName: section.skill.name,
            proficiencyLevel: 'intermediate',
            questionCount: 5,
            sectionId: section.id
          })
        });

        const genResult = await genResponse.json();
        
        if (genResult.success) {
          totalQuestions += genResult.questions?.length || 0;
          console.log(`     ✅ ${genResult.questions?.length || 0} questions`);
        } else {
          console.log(`     ❌ Error: ${genResult.error}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log(`\n✅ Generated ${totalQuestions} total questions for ${role.title}\n`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPLETE SETUP FINISHED!');
    console.log('='.repeat(60));
    console.log('\n✅ Both roles are now fully set up with:');
    console.log('   - AI-extracted skills');
    console.log('   - Skills linked to jobs');
    console.log('   - Quizzes created');
    console.log('   - Quiz sections created');
    console.log('   - AI questions generated');
    console.log('\n🚀 Ready for demo!\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

// Run
completeSetup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
