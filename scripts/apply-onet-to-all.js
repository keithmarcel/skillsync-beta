/**
 * Apply O*NET skills to all occupations
 * Direct database approach - doesn't require API server
 */

const { createClient } = require('@supabase/supabase-js');
const { getONetSkillsForOccupation, saveONetSkillsToJob } = require('../src/lib/services/onet-skills-mapper');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyONetToAll() {
  console.log('\n🚀 Starting O*NET skills population...\n');

  // Get all jobs that need skills
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, soc_code, title, long_desc')
    .not('soc_code', 'is', null);

  console.log(`Found ${jobs.length} total jobs`);

  // Check which ones need skills
  const needsSkills = [];
  for (const job of jobs) {
    const { data: existing } = await supabase
      .from('job_skills')
      .select('id')
      .eq('job_id', job.id)
      .limit(1);

    if (!existing || existing.length === 0) {
      needsSkills.push(job);
    }
  }

  console.log(`${needsSkills.length} jobs need skills\n`);

  if (needsSkills.length === 0) {
    console.log('✅ All jobs already have skills!');
    return;
  }

  let success = 0;
  let failed = 0;

  for (const job of needsSkills) {
    // Only use O*NET for standard occupations (no detailed description)
    const isStandardOccupation = !job.long_desc || job.long_desc.length < 100;

    if (!isStandardOccupation) {
      console.log(`⏭️  Skipping ${job.title} - featured role (needs hybrid approach)`);
      continue;
    }

    try {
      console.log(`Processing: ${job.title} (${job.soc_code})`);

      const onetSkills = await getONetSkillsForOccupation(job.soc_code);

      if (onetSkills.length === 0) {
        console.log(`  ❌ No O*NET skills found`);
        failed++;
        continue;
      }

      const result = await saveONetSkillsToJob(job.id, onetSkills);

      if (result.success) {
        console.log(`  ✅ Added ${result.count} skills`);
        success++;
      } else {
        console.log(`  ❌ Failed to save skills`);
        failed++;
      }

      // Small delay to be nice to O*NET API
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Complete! Success: ${success}, Failed: ${failed}`);
}

applyONetToAll().catch(console.error);
