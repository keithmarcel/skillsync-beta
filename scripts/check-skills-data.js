// Skills Data Audit Script
// Run with: node scripts/check-skills-data.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditSkillsData() {
  console.log('🔍 SKILLS DATA AUDIT\n');

  try {
    // 1. Check main skills table
    console.log('📊 1. MAIN SKILLS TABLE (first 10):');
    const { data: skills } = await supabase
      .from('skills')
      .select('id, name, category, source')
      .order('category')
      .limit(10);
    console.table(skills);

    // 2. Check job_skills for our assessment job
    console.log('\n🎯 2. JOB_SKILLS for Senior Mechanical Project Manager:');
    const { data: jobSkills } = await supabase
      .from('job_skills')
      .select(`
        importance_level,
        skills!job_skills_skill_id_fkey(id, name, category)
      `)
      .eq('job_id', '3224cbb4-45e7-4c2e-960a-7e25e678580d');
    console.log('Job skills count:', jobSkills?.length || 0);
    console.table(jobSkills);

    // 3. Check soc_skills for occupations
    console.log('\n🏢 3. SOC_SKILLS for occupations (first 5):');
    const { data: socSkills } = await supabase
      .from('soc_skills')
      .select(`
        soc_code,
        weight,
        skills!soc_skills_skill_id_fkey(id, name, category)
      `)
      .limit(5);
    console.table(socSkills);

    // 4. Check quiz questions for our assessment
    console.log('\n📝 4. QUIZ QUESTIONS for our assessment job:');
    const { data: quizQuestions } = await supabase
      .from('quiz_questions')
      .select(`
        id,
        stem,
        question_type,
        skill_id,
        skills!quiz_questions_skill_id_fkey(id, name, category)
      `)
      .eq('section_id', (
        await supabase
          .from('quiz_sections')
          .select('id')
          .eq('quiz_id', (
            await supabase
              .from('quizzes')
              .select('id')
              .eq('job_id', '3224cbb4-45e7-4c2e-960a-7e25e678580d')
              .single()
          ).data?.id)
          .single()
      ).data?.id);

    console.log('Quiz questions count:', quizQuestions?.length || 0);
    console.table(quizQuestions);

    // 5. Check jobs skills status
    console.log('\n📋 5. JOBS SKILLS STATUS:');
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, job_kind, soc_code')
      .limit(10);

    for (const job of jobs || []) {
      let skillsCount = 0;
      if (job.job_kind === 'featured_role') {
        const { count } = await supabase
          .from('job_skills')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id);
        skillsCount = count || 0;
      } else if (job.job_kind === 'occupation' && job.soc_code) {
        const { count } = await supabase
          .from('soc_skills')
          .select('*', { count: 'exact', head: true })
          .eq('soc_code', job.soc_code);
        skillsCount = count || 0;
      }

      console.log(`${job.title}: ${skillsCount} skills (${job.job_kind})`);
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
}

auditSkillsData();
