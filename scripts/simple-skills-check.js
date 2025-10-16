// Simple skills check using Next.js environment
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSkills() {
  console.log('🔍 Checking skills data...\n');
  
  // Check job_skills for our specific job
  console.log('🎯 Job Skills for Senior Mechanical Project Manager (3224cbb4-45e7-4c2e-960a-7e25e678580d):');
  const { data: jobSkills, error } = await supabase
    .from('job_skills')
    .select('importance_level, skill_id')
    .eq('job_id', '3224cbb4-45e7-4c2e-960a-7e25e678580d');
    
  console.log('Count:', jobSkills?.length || 0);
  console.log('Error:', error);
  console.log('Data:', jobSkills);
  
  // Check if job exists
  console.log('\n🏢 Job exists check:');
  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, job_kind, soc_code')
    .eq('id', '3224cbb4-45e7-4c2e-960a-7e25e678580d')
    .single();
    
  console.log('Job:', job);
}

checkSkills().catch(console.error);
