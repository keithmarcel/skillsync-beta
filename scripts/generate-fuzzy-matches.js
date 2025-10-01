const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔮 Fuzzy Matching Generator');
console.log('===========================\n');

// Jaccard similarity
function jaccardSimilarity(setA, setB) {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

async function generateFuzzyMatches(minSimilarity = 0.3, maxMatchesPerProgram = 10) {
  try {
    // Get all programs with skills
    const { data: programs } = await supabase
      .from('programs')
      .select('id, name')
      .order('name');

    console.log(`📋 Processing ${programs.length} programs...\n`);

    let totalMatches = 0;
    let programsWithMatches = 0;
    let programsSkipped = 0;

    for (let i = 0; i < programs.length; i++) {
      const program = programs[i];
      console.log(`[${i + 1}/${programs.length}] ${program.name}`);

      // Get program skills
      const { data: programSkills } = await supabase
        .from('program_skills')
        .select('skill_id')
        .eq('program_id', program.id);

      if (!programSkills || programSkills.length === 0) {
        console.log('   ⏭️  No skills - skipping');
        programsSkipped++;
        continue;
      }

      const programSkillIds = new Set(programSkills.map(ps => ps.skill_id));

      // Get all jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, soc_code');

      const matches = [];

      // Calculate similarity for each job
      for (const job of jobs) {
        const { data: jobSkills } = await supabase
          .from('job_skills')
          .select('skill_id, skill:skills(name)')
          .eq('job_id', job.id);

        if (!jobSkills || jobSkills.length === 0) continue;

        const jobSkillIds = new Set(jobSkills.map(js => js.skill_id));
        const similarity = jaccardSimilarity(programSkillIds, jobSkillIds);

        if (similarity >= minSimilarity) {
          const sharedSkillIds = [...programSkillIds].filter(id => jobSkillIds.has(id));
          const sharedSkillNames = jobSkills
            .filter(js => sharedSkillIds.includes(js.skill_id))
            .map(js => js.skill?.name)
            .filter(name => name);

          matches.push({
            jobId: job.id,
            jobTitle: job.title,
            socCode: job.soc_code,
            similarity,
            sharedSkills: sharedSkillNames
          });
        }
      }

      // Sort by similarity
      matches.sort((a, b) => b.similarity - a.similarity);
      const topMatches = matches.slice(0, maxMatchesPerProgram);

      if (topMatches.length === 0) {
        console.log('   ❌ No matches found');
        continue;
      }

      // Check existing matches
      const { data: existing } = await supabase
        .from('program_jobs')
        .select('job_id')
        .eq('program_id', program.id);

      const existingJobIds = new Set(existing?.map(e => e.job_id) || []);
      const newMatches = topMatches.filter(m => !existingJobIds.has(m.jobId));

      if (newMatches.length === 0) {
        console.log(`   ✓ ${topMatches.length} matches already exist`);
        continue;
      }

      // Insert fuzzy matches
      const programJobs = newMatches.map(match => ({
        program_id: program.id,
        job_id: match.jobId,
        match_type: 'fuzzy',
        match_confidence: match.similarity,
        notes: `${match.sharedSkills.length} shared skills: ${match.sharedSkills.slice(0, 3).join(', ')}${match.sharedSkills.length > 3 ? '...' : ''}`
      }));

      const { error } = await supabase
        .from('program_jobs')
        .insert(programJobs);

      if (error) {
        console.log('   ❌ Error inserting:', error.message);
        continue;
      }

      console.log(`   ✅ Added ${newMatches.length} fuzzy matches`);
      console.log(`   📊 Top match: ${newMatches[0].jobTitle} (${(newMatches[0].similarity * 100).toFixed(0)}% similar)`);
      console.log(`   🔗 Shared skills: ${newMatches[0].sharedSkills.slice(0, 3).join(', ')}`);

      totalMatches += newMatches.length;
      programsWithMatches++;

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n===========================');
    console.log('🎉 Fuzzy Matching Complete!');
    console.log('===========================\n');
    console.log(`✅ Programs with new matches: ${programsWithMatches}`);
    console.log(`⏭️  Programs skipped (no skills): ${programsSkipped}`);
    console.log(`🔗 Total fuzzy matches created: ${totalMatches}`);
    console.log(`📊 Average matches per program: ${(totalMatches / programsWithMatches).toFixed(1)}`);

    // Verify results
    const { count: totalProgramJobs } = await supabase
      .from('program_jobs')
      .select('*', { count: 'exact', head: true });

    const { count: fuzzyCount } = await supabase
      .from('program_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('match_type', 'fuzzy');

    console.log(`\n✅ Total program-job associations: ${totalProgramJobs}`);
    console.log(`🔮 Fuzzy matches: ${fuzzyCount}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run with 30% minimum similarity, max 10 matches per program
generateFuzzyMatches(0.3, 10);
