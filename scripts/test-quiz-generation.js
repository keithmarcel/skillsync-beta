const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuizGeneration() {
  console.log('🔍 Testing Quiz Generation Prerequisites\n');

  // 1. Find a job with skills
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, soc_code')
    .limit(10);

  console.log('Jobs with skills:');
  const jobsWithSkills = [];
  
  for (const job of jobs || []) {
    const { data: skills, count } = await supabase
      .from('job_skills')
      .select('*, skill:skills(name)', { count: 'exact' })
      .eq('job_id', job.id);
    
    if (count > 0) {
      console.log(`  ✅ ${job.title} (SOC: ${job.soc_code}): ${count} skills`);
      jobsWithSkills.push({ ...job, skillCount: count, skills });
    } else {
      console.log(`  ❌ ${job.title} (SOC: ${job.soc_code}): NO SKILLS`);
    }
  }

  if (jobsWithSkills.length === 0) {
    console.log('\n❌ No jobs have skills populated!');
    console.log('Run: Navigate to /admin/skills-data and populate skills for jobs');
    return;
  }

  // 2. Check if quiz already exists
  const testJob = jobsWithSkills[0];
  console.log(`\n📋 Testing with: ${testJob.title}`);
  
  const { data: existingQuiz } = await supabase
    .from('quizzes')
    .select('id, job_id')
    .eq('job_id', testJob.id)
    .single();

  if (existingQuiz) {
    console.log(`  ✅ Quiz already exists: ${existingQuiz.id}`);
    
    // Check questions
    const { count: questionCount } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true })
      .in('section_id', 
        await supabase
          .from('quiz_sections')
          .select('id')
          .eq('quiz_id', existingQuiz.id)
          .then(r => r.data?.map(s => s.id) || [])
      );
    
    console.log(`  Questions: ${questionCount || 0}`);
    
    if (questionCount === 0) {
      console.log('\n⚠️  Quiz exists but has NO QUESTIONS!');
      console.log('This means quiz generation failed or is incomplete.');
      console.log('\nTo fix:');
      console.log('1. Delete the quiz from /admin/assessments');
      console.log('2. Try generating again');
      console.log('3. Check server logs for OpenAI errors');
    }
  } else {
    console.log('  ℹ️  No quiz exists yet');
    console.log('\nTo generate:');
    console.log(`1. Go to /admin/assessments`);
    console.log(`2. Click "Generate Quiz"`);
    console.log(`3. Select job: ${testJob.title}`);
    console.log(`4. Wait 2-3 minutes (OpenAI is slow)`);
  }

  // 3. Check OpenAI API key
  console.log('\n🔑 Checking OpenAI API Key:');
  if (process.env.OPENAI_API_KEY) {
    console.log('  ✅ OPENAI_API_KEY is set');
  } else {
    console.log('  ❌ OPENAI_API_KEY is NOT set!');
    console.log('  Quiz generation will FAIL without this');
  }

  console.log('\n✅ Diagnostic complete!');
}

testQuizGeneration();
