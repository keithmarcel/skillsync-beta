const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🎯 Program Skills Extraction v2 (Skills-First Architecture)');
console.log('============================================================\n');

const ONET_API_BASE = 'https://services.onetcenter.org/ws';
const authHeader = 'Basic ' + Buffer.from(
  `${process.env.ONET_API_USERNAME}:${process.env.ONET_API_PASSWORD}`
).toString('base64');

// Generic skills to filter out (from memory: high-priority vs low-priority)
const GENERIC_SKILLS = [
  'Reading Comprehension', 'Active Listening', 'Speaking', 'Writing',
  'Critical Thinking', 'Active Learning', 'Monitoring', 'Social Perceptiveness',
  'Coordination', 'Persuasion', 'Negotiation', 'Instructing',
  'Complex Problem Solving', 'Judgment and Decision Making', 'Time Management',
  'Oral Comprehension', 'Written Comprehension', 'Oral Expression', 'Written Expression',
  'Near Vision', 'Speech Recognition', 'Speech Clarity', 'English Language',
  'Customer and Personal Service', // Too generic
];

async function fetchONetSkills(socCode) {
  const allSkills = [];
  
  try {
    // Fetch Skills
    const skillsResp = await fetch(`${ONET_API_BASE}/online/occupations/${socCode}/skills`, {
      headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
    });
    if (skillsResp.ok) {
      const data = await skillsResp.json();
      if (data.skills) {
        allSkills.push(...data.skills.map(s => ({
          element_id: s.element_id,
          element_name: s.element_name,
          importance: s.scale_name === 'Importance' ? parseFloat(s.data_value) : 0,
          category: 'Skills'
        })));
      }
    }
    
    // Fetch Knowledge (weighted higher)
    const knowledgeResp = await fetch(`${ONET_API_BASE}/online/occupations/${socCode}/knowledge`, {
      headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
    });
    if (knowledgeResp.ok) {
      const data = await knowledgeResp.json();
      if (data.knowledge) {
        allSkills.push(...data.knowledge.map(k => ({
          element_id: k.element_id,
          element_name: k.element_name,
          importance: k.scale_name === 'Importance' ? parseFloat(k.data_value) : 0,
          category: 'Knowledge'
        })));
      }
    }
    
    // Fetch Abilities
    const abilitiesResp = await fetch(`${ONET_API_BASE}/online/occupations/${socCode}/abilities`, {
      headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
    });
    if (abilitiesResp.ok) {
      const data = await abilitiesResp.json();
      if (data.abilities) {
        allSkills.push(...data.abilities.map(a => ({
          element_id: a.element_id,
          element_name: a.element_name,
          importance: a.scale_name === 'Importance' ? parseFloat(a.data_value) : 0,
          category: 'Abilities'
        })));
      }
    }
    
    return allSkills;
  } catch (error) {
    console.error(`  ⚠️  Error fetching O*NET data for ${socCode}:`, error.message);
    return [];
  }
}

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
    
    // Step 2: Fetch skills from O*NET for each SOC
    const allSkills = new Map(); // Deduplicate by O*NET ID
    
    for (const socCode of socCodes) {
      const skills = await fetchONetSkills(socCode);
      
      for (const skill of skills) {
        if (GENERIC_SKILLS.includes(skill.element_name)) {
          continue; // Skip generic skills
        }
        
        const existing = allSkills.get(skill.element_id);
        if (existing) {
          // Skill appears in multiple SOCs - increase importance
          existing.frequency += 1;
          existing.importance = Math.max(existing.importance, skill.importance);
        } else {
          allSkills.set(skill.element_id, {
            onet_id: skill.element_id,
            name: skill.element_name,
            importance: skill.importance,
            category: skill.category,
            frequency: 1,
          });
        }
      }
      
      // Rate limiting for O*NET (20 req/min)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    if (allSkills.size === 0) {
      return { success: false, error: 'No skills found' };
    }
    
    // Step 3: Rank skills by composite score
    const rankedSkills = Array.from(allSkills.values())
      .map(skill => {
        // Score = importance (60%) + frequency (40%)
        const normalizedImportance = skill.importance / 5; // O*NET uses 1-5 scale
        const normalizedFrequency = skill.frequency / socCodes.length;
        const compositeScore = (normalizedImportance * 0.6) + (normalizedFrequency * 0.4);
        
        return { ...skill, compositeScore };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore);
    
    // Step 4: Select top 10 skills
    const topSkills = rankedSkills.slice(0, 10);
    
    // Step 5: Match to skills in our database
    const skillsToInsert = [];
    
    for (const skill of topSkills) {
      // Try to find by O*NET ID first
      let { data: dbSkill } = await supabase
        .from('skills')
        .select('id')
        .eq('onet_id', skill.onet_id)
        .single();
      
      // If not found by O*NET ID, try by name (Lightcast might have it)
      if (!dbSkill) {
        const { data: byName } = await supabase
          .from('skills')
          .select('id')
          .ilike('name', skill.name)
          .single();
        
        dbSkill = byName;
      }
      
      // If still not found, create it
      if (!dbSkill) {
        const { data: newSkill, error } = await supabase
          .from('skills')
          .insert({
            name: skill.name,
            onet_id: skill.onet_id,
            category: skill.category,
            source: 'ONET',
            source_version: 'latest',
            is_active: true,
          })
          .select('id')
          .single();
        
        if (!error && newSkill) {
          dbSkill = newSkill;
        }
      }
      
      if (dbSkill) {
        skillsToInsert.push({
          program_id: programId,
          skill_id: dbSkill.id,
          weight: skill.compositeScore,
        });
      }
    }
    
    if (skillsToInsert.length === 0) {
      return { success: false, error: 'No skills matched to database' };
    }
    
    // Step 6: Delete existing and insert new
    await supabase
      .from('program_skills')
      .delete()
      .eq('program_id', programId);
    
    const { error: insertError } = await supabase
      .from('program_skills')
      .insert(skillsToInsert);
    
    if (insertError) {
      return { success: false, error: insertError.message };
    }
    
    // Step 7: Update skills_count
    await supabase
      .from('programs')
      .update({ skills_count: skillsToInsert.length })
      .eq('id', programId);
    
    return {
      success: true,
      skillsCount: skillsToInsert.length,
      skills: topSkills.map(s => s.name),
      socCount: socCodes.length,
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function processAllPrograms() {
  try {
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
        console.log(`   📊 From ${result.socCount} SOCs via O*NET API`);
        console.log(`   Skills: ${result.skills.slice(0, 3).join(', ')}...`);
        successful++;
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        failed++;
        failures.push({ name: program.name, cip: program.cip_code, error: result.error });
      }
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
