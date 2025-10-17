/**
 * Analyze programs and Power Design roles for intelligent crosswalking
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeCrosswalk() {
  console.log('🔍 Analyzing Programs and Power Design Roles for Crosswalking\n');
  console.log('='.repeat(70));

  // 1. Get Power Design roles with their skills
  console.log('\n📋 Step 1: Fetching Power Design Roles...\n');
  const { data: powerDesignRoles, error: rolesError } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      soc_code,
      job_skills!inner(
        skill_id,
        importance_level,
        skills(id, name, category)
      )
    `)
    .eq('company_id', 'e5848012-89df-449e-855a-1834e9389656')
    .eq('job_kind', 'featured_role')
    .eq('status', 'published');

  if (rolesError) {
    console.error('Error fetching roles:', rolesError);
    return;
  }

  console.log(`✅ Found ${powerDesignRoles.length} Power Design roles\n`);

  // 2. Get all published programs with their skills
  console.log('📚 Step 2: Fetching Published Programs...\n');
  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select(`
      id,
      name,
      discipline,
      program_type,
      program_skills(
        skill_id,
        skills(id, name, category)
      )
    `)
    .eq('status', 'published');

  if (programsError) {
    console.error('Error fetching programs:', programsError);
    return;
  }

  console.log(`✅ Found ${programs.length} published programs\n`);

  // 3. Analyze skill overlap
  console.log('🔗 Step 3: Analyzing Skill Overlap...\n');
  console.log('='.repeat(70));

  for (const role of powerDesignRoles) {
    console.log(`\n🎯 Role: ${role.title}`);
    console.log(`   SOC: ${role.soc_code}`);
    
    const roleSkills = role.job_skills.map(js => ({
      id: js.skills.id,
      name: js.skills.name,
      category: js.skills.category,
      importance: js.importance_level
    }));
    
    console.log(`   Skills: ${roleSkills.length}`);
    
    // Find programs with matching skills
    const matches = [];
    
    for (const program of programs) {
      if (!program.program_skills || program.program_skills.length === 0) continue;
      
      const programSkillIds = program.program_skills.map(ps => ps.skills.id);
      const roleSkillIds = roleSkills.map(rs => rs.id);
      
      const matchingSkills = roleSkillIds.filter(id => programSkillIds.includes(id));
      const matchPercentage = (matchingSkills.length / roleSkillIds.length) * 100;
      
      if (matchingSkills.length > 0) {
        matches.push({
          program: program.name,
          discipline: program.discipline,
          programType: program.program_type,
          matchingSkills: matchingSkills.length,
          totalRoleSkills: roleSkillIds.length,
          matchPercentage: matchPercentage.toFixed(1)
        });
      }
    }
    
    // Sort by match percentage
    matches.sort((a, b) => b.matchingSkills - a.matchingSkills);
    
    if (matches.length > 0) {
      console.log(`\n   ✅ Found ${matches.length} programs with matching skills:`);
      matches.slice(0, 5).forEach(match => {
        console.log(`      • ${match.program}`);
        console.log(`        ${match.matchingSkills}/${match.totalRoleSkills} skills (${match.matchPercentage}%)`);
        console.log(`        ${match.discipline || 'N/A'} - ${match.programType || 'N/A'}`);
      });
    } else {
      console.log(`\n   ⚠️  No programs found with matching skills`);
    }
  }

  // 4. Summary: Programs with NO skills
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 SUMMARY: Programs Without Skills\n');
  
  const programsWithoutSkills = programs.filter(p => !p.program_skills || p.program_skills.length === 0);
  console.log(`Total programs: ${programs.length}`);
  console.log(`Programs with skills: ${programs.length - programsWithoutSkills.length}`);
  console.log(`Programs without skills: ${programsWithoutSkills.length}\n`);
  
  if (programsWithoutSkills.length > 0) {
    console.log('Programs that need skills:');
    programsWithoutSkills.slice(0, 10).forEach(p => {
      console.log(`   • ${p.name} (${p.discipline})`);
    });
    if (programsWithoutSkills.length > 10) {
      console.log(`   ... and ${programsWithoutSkills.length - 10} more`);
    }
  }

  console.log('\n' + '='.repeat(70));
}

analyzeCrosswalk()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
