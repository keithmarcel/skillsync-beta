const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔄 Job Skills Enrichment (Lightcast + O*NET)');
console.log('=============================================\n');

async function enrichJobSkills() {
  try {
    // Get all jobs with SOC codes
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, soc_code, skills_count')
      .not('soc_code', 'is', null)
      .order('title');

    if (error) {
      console.error('❌ Error fetching jobs:', error);
      return;
    }

    console.log(`📋 Found ${jobs.length} jobs with SOC codes\n`);
    console.log('Strategy: Lightcast first (comprehensive), O*NET for validation\n');

    let enriched = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      console.log(`\n[${i + 1}/${jobs.length}] ${job.title}`);
      console.log(`   SOC: ${job.soc_code}`);
      console.log(`   Current skills: ${job.skills_count || 0}`);

      // For now, just show what would happen
      // You can uncomment the enrichment call when ready
      console.log(`   ⏭️  Skipping (use enrichment service to update)`);
      skipped++;
      
      /*
      // Uncomment to actually enrich:
      const result = await skillsEnrichmentService.enrichJobSkills(
        job.id,
        job.soc_code,
        true // force refresh
      );
      
      if (result.success) {
        console.log(`   ✅ Enriched with ${result.skillsAdded} skills`);
        console.log(`   Source: ${result.source}`);
        enriched++;
      } else {
        console.log(`   ❌ Failed: ${result.errors.join(', ')}`);
        errors++;
      }
      */
    }

    console.log('\n=============================================');
    console.log('📊 Summary');
    console.log('=============================================\n');
    console.log(`Total jobs: ${jobs.length}`);
    console.log(`Enriched: ${enriched}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    
    console.log('\n💡 Next Steps:');
    console.log('1. Wait for Lightcast import to complete');
    console.log('2. Uncomment enrichment code in this script');
    console.log('3. Run: node scripts/enrich-job-skills.js');
    console.log('4. Review enriched skills in /admin/skills');
    
  } catch (error) {
    console.error('❌ Enrichment failed:', error);
    process.exit(1);
  }
}

enrichJobSkills();
