const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 O*NET Skills Import (Backup Source)');
console.log('=======================================\n');

const ONET_API_BASE = 'https://services.onetcenter.org/ws';
const authHeader = 'Basic ' + Buffer.from(
  `${process.env.ONET_API_USERNAME}:${process.env.ONET_API_PASSWORD}`
).toString('base64');

async function fetchONetSkills(socCode) {
  const skills = [];
  
  try {
    // Fetch Skills
    const skillsResp = await fetch(`${ONET_API_BASE}/online/occupations/${socCode}/skills`, {
      headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
    });
    if (skillsResp.ok) {
      const data = await skillsResp.json();
      if (data.skills) skills.push(...data.skills.map(s => ({ ...s, category: 'Skills' })));
    }
    
    // Fetch Knowledge
    const knowledgeResp = await fetch(`${ONET_API_BASE}/online/occupations/${socCode}/knowledge`, {
      headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
    });
    if (knowledgeResp.ok) {
      const data = await knowledgeResp.json();
      if (data.knowledge) skills.push(...data.knowledge.map(k => ({ ...k, category: 'Knowledge' })));
    }
    
    // Fetch Abilities
    const abilitiesResp = await fetch(`${ONET_API_BASE}/online/occupations/${socCode}/abilities`, {
      headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
    });
    if (abilitiesResp.ok) {
      const data = await abilitiesResp.json();
      if (data.abilities) skills.push(...data.abilities.map(a => ({ ...a, category: 'Abilities' })));
    }
    
    return skills;
  } catch (error) {
    console.error(`Error fetching O*NET data for ${socCode}:`, error.message);
    return [];
  }
}

async function importONetSkills() {
  try {
    // Get all unique SOC codes from crosswalk
    const { data: socMappings } = await supabase
      .from('cip_soc_crosswalk')
      .select('soc_code');
    
    const uniqueSOCs = [...new Set(socMappings.map(m => m.soc_code))];
    
    console.log(`📋 Found ${uniqueSOCs.length} unique SOC codes\n`);
    console.log('📥 Fetching skills from O*NET...\n');
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const allSkills = new Map(); // Deduplicate by onet_id
    
    for (let i = 0; i < uniqueSOCs.length; i++) {
      const socCode = uniqueSOCs[i];
      
      console.log(`[${i + 1}/${uniqueSOCs.length}] Processing ${socCode}...`);
      
      const skills = await fetchONetSkills(socCode);
      
      for (const skill of skills) {
        if (!allSkills.has(skill.element_id)) {
          allSkills.set(skill.element_id, {
            name: skill.element_name,
            onet_id: skill.element_id,
            category: skill.category,
            description: skill.description || '',
            importance: skill.data_value || 0,
          });
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000)); // O*NET: 20 req/min
    }
    
    console.log(`\n✅ Collected ${allSkills.size} unique skills from O*NET\n`);
    console.log('💾 Importing to database...\n');
    
    for (const [onetId, skillData] of allSkills) {
      try {
        // Check if exists
        const { data: existing } = await supabase
          .from('skills')
          .select('id')
          .eq('onet_id', onetId)
          .single();
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Insert
        const { error } = await supabase
          .from('skills')
          .insert({
            name: skillData.name,
            onet_id: skillData.onet_id,
            category: skillData.category,
            description: skillData.description,
            source: 'ONET',
            source_version: 'latest',
            is_active: true,
          });
        
        if (error) {
          errors++;
        } else {
          imported++;
        }
        
      } catch (err) {
        errors++;
      }
    }
    
    console.log('\n==========================');
    console.log('🎉 O*NET Import Complete!');
    console.log('==========================\n');
    console.log(`✅ Imported: ${imported}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    
    const { count: totalSkills } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total skills in database: ${totalSkills}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importONetSkills();
