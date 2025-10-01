const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔗 Enhance Lightcast Skills with O*NET Descriptions');
console.log('===================================================\n');

async function enhanceLightcastSkills() {
  try {
    // Get all O*NET skills with descriptions
    const { data: onetSkills, error: onetError } = await supabase
      .from('skills')
      .select('name, description, onet_id')
      .eq('source', 'ONET')
      .not('description', 'is', null)
      .neq('description', '');

    if (onetError) {
      console.error('❌ Error fetching O*NET skills:', onetError);
      return;
    }

    console.log(`📚 Found ${onetSkills.length} O*NET skills with descriptions\n`);

    // Get all Lightcast skills without descriptions
    const { data: lightcastSkills, error: lightcastError } = await supabase
      .from('skills')
      .select('id, name, description')
      .eq('source', 'LIGHTCAST')
      .or('description.is.null,description.eq.');

    if (lightcastError) {
      console.error('❌ Error fetching Lightcast skills:', lightcastError);
      return;
    }

    console.log(`🔍 Found ${lightcastSkills.length} Lightcast skills without descriptions\n`);
    console.log('Matching by name (case-insensitive)...\n');

    let matched = 0;
    let updated = 0;
    let errors = 0;

    // Helper function to calculate similarity (Levenshtein-like)
    function similarity(s1, s2) {
      const longer = s1.length > s2.length ? s1 : s2;
      const shorter = s1.length > s2.length ? s2 : s1;
      
      if (longer.length === 0) return 1.0;
      
      // Check if one contains the other
      if (longer.includes(shorter)) return 0.8;
      
      // Check word overlap
      const words1 = s1.split(/\s+/);
      const words2 = s2.split(/\s+/);
      const commonWords = words1.filter(w => words2.includes(w)).length;
      const totalWords = Math.max(words1.length, words2.length);
      
      return commonWords / totalWords;
    }

    // Create a map of O*NET skills by normalized name
    const onetMap = new Map();
    onetSkills.forEach(skill => {
      const normalizedName = skill.name.toLowerCase().trim();
      onetMap.set(normalizedName, skill);
    });

    // Match Lightcast skills to O*NET
    for (let i = 0; i < lightcastSkills.length; i++) {
      const lightcastSkill = lightcastSkills[i];
      const normalizedName = lightcastSkill.name.toLowerCase().trim();

      if (i % 1000 === 0 && i > 0) {
        console.log(`Progress: ${i}/${lightcastSkills.length} (${((i/lightcastSkills.length)*100).toFixed(1)}%)`);
      }

      // Check for exact match first
      let onetMatch = onetMap.get(normalizedName);

      // If no exact match, try fuzzy matching
      if (!onetMatch) {
        let bestMatch = null;
        let bestScore = 0;

        for (const [onetName, onetSkill] of onetMap) {
          const score = similarity(normalizedName, onetName);
          
          // Require at least 70% similarity
          if (score > bestScore && score >= 0.7) {
            bestScore = score;
            bestMatch = onetSkill;
          }
        }

        if (bestMatch) {
          onetMatch = bestMatch;
          if (updated < 10) {
            console.log(`  🔗 Fuzzy match (${(bestScore * 100).toFixed(0)}%): "${lightcastSkill.name}" → "${bestMatch.name}"`);
          }
        }
      }

      if (onetMatch) {
        matched++;

        // Update Lightcast skill with O*NET description
        const { error: updateError } = await supabase
          .from('skills')
          .update({
            description: onetMatch.description,
            onet_id: onetMatch.onet_id, // Also link the O*NET ID
          })
          .eq('id', lightcastSkill.id);

        if (updateError) {
          console.error(`  ❌ Error updating ${lightcastSkill.name}:`, updateError.message);
          errors++;
        } else {
          updated++;
          
          if (updated <= 10) {
            console.log(`  ✅ ${lightcastSkill.name}`);
            console.log(`     → ${onetMatch.description.substring(0, 80)}...`);
          }
        }
      }
    }

    console.log('\n===================================================');
    console.log('🎉 Enhancement Complete!');
    console.log('===================================================\n');
    console.log(`📊 Results:`);
    console.log(`   O*NET skills available: ${onetSkills.length}`);
    console.log(`   Lightcast skills checked: ${lightcastSkills.length}`);
    console.log(`   Matches found: ${matched}`);
    console.log(`   Successfully updated: ${updated}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Match rate: ${((matched/lightcastSkills.length)*100).toFixed(1)}%`);

    // Verify results
    const { count: lightcastWithDesc } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'LIGHTCAST')
      .not('description', 'is', null)
      .neq('description', '');

    const { count: totalLightcast } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'LIGHTCAST');

    console.log(`\n✅ Lightcast skills with descriptions: ${lightcastWithDesc} / ${totalLightcast} (${((lightcastWithDesc/totalLightcast)*100).toFixed(1)}%)`);

  } catch (error) {
    console.error('❌ Enhancement failed:', error);
    process.exit(1);
  }
}

enhanceLightcastSkills();
