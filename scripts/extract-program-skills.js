const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🎯 Program Skills Extraction');
console.log('============================\n');

async function extractSkillsForProgram(programId, programName, cipCode) {
  try {
    // Step 1: Get SOC codes from crosswalk
    const { data: socMappings } = await supabase
      .from('cip_soc_crosswalk')
      .select('soc_code')
      .eq('cip_code', cipCode);

    if (!socMappings || socMappings.length === 0) {
      return { success: false, error: 'No SOC mappings' };
    }

    const socCodes = socMappings.map(m => m.soc_code);

    // Step 2: Get jobs for these SOC codes
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, soc_code')
      .in('soc_code', socCodes);

    if (!jobs || jobs.length === 0) {
      return { success: false, error: `No jobs for SOCs: ${socCodes.slice(0, 3).join(', ')}...` };
    }

    const jobIds = jobs.map(j => j.id);

    // Step 3: Get skills for these jobs
    const { data: jobSkills } = await supabase
      .from('job_skills')
      .select(`
        skill_id,
        weight,
        importance_level,
        onet_data_source,
        skill:skills(id, name)
      `)
      .in('job_id', jobIds);

    if (!jobSkills || jobSkills.length === 0) {
      return { success: false, error: 'No skills found' };
    }

    // Step 4: Aggregate and rank skills
    const skillsMap = new Map();

    for (const js of jobSkills) {
      if (!js.skill || !js.skill.id) continue;

      const skillId = js.skill.id;
      const existing = skillsMap.get(skillId);
      const onetImportance = js.onet_data_source?.importance || 0;

      if (existing) {
        existing.frequency += 1;
        existing.weight = (existing.weight + (js.weight || 0)) / 2;
        existing.importance = (existing.importance + onetImportance) / 2;
      } else {
        skillsMap.set(skillId, {
          skill_id: skillId,
          skill_name: js.skill.name,
          weight: js.weight || 0,
          frequency: 1,
          importance: onetImportance
        });
      }
    }

    const allSkills = Array.from(skillsMap.values());

    // Step 5: Rank by composite score
    const rankedSkills = allSkills
      .map(skill => {
        const normalizedFrequency = skill.frequency / jobs.length;
        const normalizedImportance = skill.importance / 5;
        const normalizedWeight = skill.weight;

        const compositeScore =
          normalizedFrequency * 0.4 +
          normalizedImportance * 0.4 +
          normalizedWeight * 0.2;

        return { ...skill, compositeScore };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore);

    // Step 6: Select top 8
    const topSkills = rankedSkills.slice(0, 8);

    // Step 7: Insert into program_skills
    await supabase
      .from('program_skills')
      .delete()
      .eq('program_id', programId);

    const programSkills = topSkills.map(skill => ({
      program_id: programId,
      skill_id: skill.skill_id,
      weight: skill.weight
    }));

    const { error: insertError } = await supabase
      .from('program_skills')
      .insert(programSkills);

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return {
      success: true,
      skillsCount: topSkills.length,
      skills: topSkills.map(s => s.skill_name),
      socCount: socCodes.length,
      jobCount: jobs.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function processAllPrograms() {
  try {
    // Get all programs with CIP codes
    const { data: programs, error } = await supabase
      .from('programs')
      .select('id, name, cip_code')
      .not('cip_code', 'is', null)
      .order('name');

    if (error) {
      console.error('❌ Error fetching programs:', error);
      return;
    }

    console.log(`📋 Found ${programs.length} programs with CIP codes\n`);

    let successful = 0;
    let failed = 0;
    const failures = [];

    for (let i = 0; i < programs.length; i++) {
      const program = programs[i];
      console.log(`\n[${i + 1}/${programs.length}] ${program.name}`);
      console.log(`   CIP: ${program.cip_code}`);

      const result = await extractSkillsForProgram(
        program.id,
        program.name,
        program.cip_code
      );

      if (result.success) {
        console.log(`   ✅ Extracted ${result.skillsCount} skills`);
        console.log(`   📊 From ${result.socCount} SOCs, ${result.jobCount} jobs`);
        console.log(`   Skills: ${result.skills.slice(0, 3).join(', ')}...`);
        successful++;
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        failed++;
        failures.push({ name: program.name, cip: program.cip_code, error: result.error });
      }

      // Rate limiting - small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n============================');
    console.log('🎉 Extraction Complete!');
    console.log('============================\n');
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);

    if (failures.length > 0) {
      console.log('\nFailed programs:');
      failures.slice(0, 10).forEach(f => {
        console.log(`  - ${f.name} (${f.cip}): ${f.error}`);
      });
      if (failures.length > 10) {
        console.log(`  ... and ${failures.length - 10} more`);
      }
    }

    // Verify results
    const { count: programSkillsCount } = await supabase
      .from('program_skills')
      .select('*', { count: 'exact', head: true });

    console.log(`\n✅ Total program_skills entries: ${programSkillsCount}`);
  } catch (error) {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  }
}

processAllPrograms();
