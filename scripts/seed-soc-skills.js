#!/usr/bin/env node

/**
 * SOC Skills Seeding Script
 * Seeds soc_skills table with curated skills for all current SOC codes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Comprehensive skills data for all 38 SOC codes
const SOC_SKILLS = require('./soc-skills-data.json');

async function seedSOCSkills() {
  console.log('🌱 Starting SOC skills seeding...\n');
  
  let totalSkillsAdded = 0;
  let totalMappingsCreated = 0;
  
  for (const [socCode, data] of Object.entries(SOC_SKILLS)) {
    console.log(`\n📋 ${data.title} (${socCode})`);
    
    const allSkills = [
      ...(data.core || []),
      ...(data.tech || []),
      ...(data.soft || []),
      ...(data.certs || []),
      ...(data.methods || [])
    ];
    
    console.log(`   Processing ${allSkills.length} skills...`);
    
    for (let i = 0; i < allSkills.length; i++) {
      const skillName = allSkills[i];
      
      // Get or create skill
      let { data: skill } = await supabase
        .from('skills')
        .select('id')
        .eq('name', skillName)
        .single();
      
      if (!skill) {
        const { data: newSkill, error } = await supabase
          .from('skills')
          .insert({
            name: skillName,
            source: 'HYBRID',
            category: categorizeSkill(skillName),
            is_assessable: true,
            is_active: true
          })
          .select('id')
          .single();
        
        if (error) {
          console.error(`   ❌ Error creating "${skillName}": ${error.message}`);
          continue;
        }
        
        skill = newSkill;
        totalSkillsAdded++;
      }
      
      // Check if mapping exists
      const { data: existing } = await supabase
        .from('soc_skills')
        .select('id')
        .eq('soc_code', socCode)
        .eq('skill_id', skill.id)
        .single();
      
      if (existing) continue;
      
      // Create mapping
      const weight = calculateWeight(skillName, data, i);
      
      const { error } = await supabase
        .from('soc_skills')
        .insert({
          soc_code: socCode,
          skill_id: skill.id,
          weight: weight,
          display_order: i + 1
        });
      
      if (!error) {
        totalMappingsCreated++;
      }
    }
    
    console.log(`   ✅ Complete`);
  }
  
  console.log(`\n\n🎉 Seeding complete!`);
  console.log(`   📊 SOC Codes: ${Object.keys(SOC_SKILLS).length}`);
  console.log(`   ✨ New Skills: ${totalSkillsAdded}`);
  console.log(`   🔗 Mappings: ${totalMappingsCreated}`);
}

function categorizeSkill(name) {
  const lower = name.toLowerCase();
  
  if (lower.match(/(javascript|python|java|sql|react|programming|code|api|aws|azure|docker)/)) {
    return 'IT and Software Development';
  }
  if (lower.match(/(management|leadership|strategy|planning|budget)/)) {
    return 'Business and Management';
  }
  if (lower.match(/(financial|accounting|tax|audit|investment)/)) {
    return 'Finance and Accounting';
  }
  if (lower.match(/(patient|medical|clinical|nursing|health)/)) {
    return 'Healthcare';
  }
  if (lower.match(/(construction|electrical|carpentry|safety|osha)/)) {
    return 'Skilled Trades';
  }
  if (lower.match(/(sales|marketing|crm|customer|negotiation)/)) {
    return 'Sales and Marketing';
  }
  if (lower.match(/(communication|teamwork|problem|critical|organization)/)) {
    return 'Professional Skills';
  }
  if (lower.match(/(microsoft|excel|salesforce|software|system)/)) {
    return 'Tools and Software';
  }
  
  return 'General';
}

function calculateWeight(name, data, index) {
  if (data.core && data.core.includes(name)) return 0.9 - (index * 0.01);
  if (data.certs && data.certs.includes(name)) return 0.85;
  if (data.tech && data.tech.includes(name)) return 0.75 - (index * 0.01);
  if (data.methods && data.methods.includes(name)) return 0.7;
  if (data.soft && data.soft.includes(name)) return 0.6;
  return 0.5;
}

// Run if called directly
if (require.main === module) {
  seedSOCSkills()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedSOCSkills };
