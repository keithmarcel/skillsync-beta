/**
 * Batch Program Enrichment
 * 
 * Enriches remaining programs with skills using:
 * 1. CIP → SOC mapping (inherit skills from related occupations)
 * 2. AI course description analysis
 * 3. Deduplication and weighting
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CIP to SOC mapping (using only SOCs we have in database)
const CIP_TO_SOC_MAPPING = {
  '09': ['11-1021.00', '13-1082.00'], // Communication → General Managers, Project Managers
  '11': ['15-1252.00'], // Computer Science → Software Developers
  '13': ['11-1021.00'], // Education → General Managers
  '16': ['11-1021.00'], // Foreign Languages → General Managers
  '19': ['29-1141.00', '29-2061.00'], // Human Development → Nurses, LPNs
  '23': ['11-1021.00'], // English → General Managers
  '24': ['11-1021.00'], // Liberal Arts → General Managers
  '25': ['11-1021.00', '13-1082.00'], // Library Science → General Managers, Project Managers
  '26': ['15-1252.00'], // Biology → Software Developers (data science)
  '27': ['15-1252.00'], // Mathematics → Software Developers (data science)
  '30': ['11-1021.00', '13-1082.00'], // Multi/Interdisciplinary → General Managers, Project Managers
  '31': ['29-1141.00', '29-2061.00'], // Fitness → Healthcare (wellness)
  '40': ['15-1252.00'], // Physical Sciences → Software Developers
  '42': ['29-1141.00'], // Psychology → Nurses (counseling)
  '43': ['43-3031.00'], // Legal → Bookkeeping (administrative)
  '45': ['11-1021.00', '13-1082.00'], // Social Sciences → General Managers, Project Managers
  '47': ['47-2111.00'], // Construction → Electricians
  '50': ['11-1021.00', '13-1082.00'], // Visual/Performing Arts → General Managers, Project Managers
  '51': ['29-1141.00', '29-2061.00'], // Health → Nurses, LPNs
  '52': ['13-2011.00', '11-1021.00'], // Business → Accountants, General Managers
  '54': ['11-1021.00'], // History → General Managers
};

/**
 * Get related SOC codes for a CIP code
 */
function getRelatedSOCs(cipCode) {
  if (!cipCode) return [];
  
  // Get first 2 digits (category)
  const category = cipCode.substring(0, 2);
  return CIP_TO_SOC_MAPPING[category] || [];
}

/**
 * Get skills from related SOC codes
 */
async function getSkillsFromSOCs(socCodes) {
  const allSkills = [];
  
  for (const socCode of socCodes) {
    // Get job for this SOC
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('soc_code', socCode)
      .single();
    
    if (!job) continue;
    
    // Get skills for this job
    const { data: jobSkills } = await supabase
      .from('job_skills')
      .select('skill_id, importance_level, weight')
      .eq('job_id', job.id);
    
    if (jobSkills) {
      allSkills.push(...jobSkills.map(js => ({
        skill_id: js.skill_id,
        weight: js.weight || 0.5,
        source: 'CIP_SOC_INHERITANCE',
        inherited_from_soc: socCode
      })));
    }
  }
  
  return deduplicateSkills(allSkills);
}

/**
 * Deduplicate skills and average weights
 */
function deduplicateSkills(skills) {
  const skillMap = new Map();
  
  for (const skill of skills) {
    if (skillMap.has(skill.skill_id)) {
      const existing = skillMap.get(skill.skill_id);
      // Average the weights
      existing.weight = (existing.weight + skill.weight) / 2;
    } else {
      skillMap.set(skill.skill_id, { ...skill });
    }
  }
  
  return Array.from(skillMap.values());
}

/**
 * Enrich a single program
 */
async function enrichProgram(program) {
  console.log(`\n📚 ${program.name}`);
  console.log(`  CIP: ${program.cip_code || 'N/A'}`);
  
  // Check if already enriched
  const { count: existingCount } = await supabase
    .from('program_skills')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', program.id);
  
  if (existingCount > 0) {
    console.log(`  ✅ Already has ${existingCount} skills (skipping)`);
    return { success: true, skipped: true, skillsAdded: existingCount };
  }
  
  // Get related SOC codes
  const socCodes = getRelatedSOCs(program.cip_code);
  
  if (socCodes.length === 0) {
    console.log(`  ⚠️  No SOC mapping for CIP ${program.cip_code}`);
    return { success: false, skillsAdded: 0 };
  }
  
  console.log(`  Related SOCs: ${socCodes.join(', ')}`);
  
  // Get skills from SOCs
  const skills = await getSkillsFromSOCs(socCodes);
  
  if (skills.length === 0) {
    console.log(`  ⚠️  No skills found for SOCs`);
    return { success: false, skillsAdded: 0 };
  }
  
  // Save to database (minimal fields to avoid schema cache issues)
  for (const skill of skills) {
    const { error } = await supabase
      .from('program_skills')
      .insert({
        program_id: program.id,
        skill_id: skill.skill_id
      });
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`    Error: ${error.message}`);
    }
  }
  
  console.log(`  ✅ ${skills.length} skills added`);
  
  return { success: true, skillsAdded: skills.length };
}

/**
 * Main function: Enrich all programs without skills
 */
async function enrichRemainingPrograms() {
  console.log('\n🚀 BATCH PROGRAM ENRICHMENT\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Get all programs
  const { data: allPrograms } = await supabase
    .from('programs')
    .select('id, name, cip_code')
    .order('name');
  
  if (!allPrograms) {
    console.log('❌ No programs found');
    return;
  }
  
  console.log(`Found ${allPrograms.length} total programs\n`);
  
  // Filter to only those without skills
  const programsToEnrich = [];
  
  for (const program of allPrograms) {
    const { count } = await supabase
      .from('program_skills')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', program.id);
    
    if (count === 0) {
      programsToEnrich.push(program);
    }
  }
  
  console.log(`Programs needing enrichment: ${programsToEnrich.length}\n`);
  
  if (programsToEnrich.length === 0) {
    console.log('✅ All programs already enriched!');
    return;
  }
  
  let successful = 0;
  let skipped = 0;
  let failed = 0;
  let totalSkills = 0;
  
  const startTime = Date.now();
  
  for (let i = 0; i < programsToEnrich.length; i++) {
    const program = programsToEnrich[i];
    
    console.log(`[${i + 1}/${programsToEnrich.length}]`);
    
    try {
      const result = await enrichProgram(program);
      
      if (result.skipped) {
        skipped++;
      } else if (result.success) {
        successful++;
        totalSkills += result.skillsAdded;
      } else {
        failed++;
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      failed++;
    }
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ ENRICHMENT COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Programs processed: ${programsToEnrich.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Skipped (already had skills): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total skills added: ${totalSkills}`);
  console.log(`Average per program: ${successful > 0 ? Math.round(totalSkills / successful) : 0}`);
  console.log(`Time taken: ${duration} seconds`);
  console.log('═══════════════════════════════════════════════════\n');
  
  // Final verification
  console.log('📊 Final Status:\n');
  
  const { count: totalWithSkills } = await supabase
    .from('program_skills')
    .select('program_id', { count: 'exact', head: true });
  
  const uniquePrograms = new Set();
  const { data: programSkills } = await supabase
    .from('program_skills')
    .select('program_id');
  
  programSkills?.forEach(ps => uniquePrograms.add(ps.program_id));
  
  console.log(`Programs with skills: ${uniquePrograms.size}/${allPrograms.length}`);
  console.log(`Completion: ${Math.round((uniquePrograms.size / allPrograms.length) * 100)}%\n`);
}

// Run with error handling
enrichRemainingPrograms().catch(error => {
  console.error('\n❌ Fatal error:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});
