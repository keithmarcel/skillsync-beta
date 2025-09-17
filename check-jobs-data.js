const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeJobsData() {
  console.log('=== ANALYZING JOBS TABLE DATA ===\n');
  
  // Check total jobs and breakdown by job_kind
  const { data: allJobs, error } = await supabase
    .from('jobs')
    .select('id, title, job_kind, company_id, category, soc_code')
    .order('job_kind, title');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total jobs in database:', allJobs.length);
  
  // Group by job_kind
  const byJobKind = {};
  allJobs.forEach(job => {
    if (!byJobKind[job.job_kind]) byJobKind[job.job_kind] = [];
    byJobKind[job.job_kind].push(job);
  });
  
  console.log('\n=== BREAKDOWN BY JOB_KIND ===');
  Object.keys(byJobKind).forEach(kind => {
    console.log(`${kind}: ${byJobKind[kind].length} jobs`);
  });
  
  console.log('\n=== FEATURED ROLES (job_kind = featured_role) ===');
  if (byJobKind['featured_role']) {
    byJobKind['featured_role'].forEach(job => {
      console.log(`- ${job.title} (Company ID: ${job.company_id || 'None'}, Category: ${job.category || 'None'})`);
    });
  } else {
    console.log('No featured roles found');
  }
  
  console.log('\n=== HIGH DEMAND OCCUPATIONS (job_kind = occupation) ===');
  if (byJobKind['occupation']) {
    console.log(`First 10 of ${byJobKind['occupation'].length} occupations:`);
    byJobKind['occupation'].slice(0, 10).forEach(job => {
      console.log(`- ${job.title} (SOC: ${job.soc_code || 'None'}, Category: ${job.category || 'None'})`);
    });
  } else {
    console.log('No occupations found');
  }
  
  // Check companies
  console.log('\n=== COMPANIES IN DATABASE ===');
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .order('name');
  
  if (companies && companies.length > 0) {
    companies.forEach(company => {
      console.log(`- ${company.name} (ID: ${company.id})`);
    });
  } else {
    console.log('No companies found');
  }
}

analyzeJobsData().then(() => {
  console.log('\n=== Analysis Complete ===');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
