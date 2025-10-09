#!/usr/bin/env node

/**
 * Check assessment skill data to see if we have real skill names
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSkillData() {
  console.log('🔍 Checking assessment skill data...\n');

  try {
    // Get assessments with skill results
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select(`
        id,
        user_id,
        job_id,
        readiness_pct,
        skill_results:assessment_skill_results(
          skill_id,
          score_pct,
          band,
          skill:skills(
            id,
            name
          )
        )
      `)
      .limit(3);

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    if (!assessments || assessments.length === 0) {
      console.log('📭 No assessments found\n');
      process.exit(0);
    }

    console.log(`📊 Found ${assessments.length} assessment(s):\n`);
    console.log('='.repeat(80));

    assessments.forEach((assessment, index) => {
      console.log(`\n#${index + 1} - Assessment ID: ${assessment.id.substring(0, 8)}...`);
      console.log('-'.repeat(80));
      console.log(`📈 Readiness: ${assessment.readiness_pct}%`);
      console.log(`🎯 Skill Results: ${assessment.skill_results?.length || 0} skills`);
      
      if (assessment.skill_results && assessment.skill_results.length > 0) {
        console.log('\nSkills by Band:');
        
        const proficient = assessment.skill_results.filter(sr => sr.band === 'proficient');
        const building = assessment.skill_results.filter(sr => sr.band === 'building');
        const needs_dev = assessment.skill_results.filter(sr => sr.band === 'needs_dev');
        
        if (proficient.length > 0) {
          console.log(`\n  ✅ Proficient (${proficient.length}):`);
          proficient.slice(0, 3).forEach(sr => {
            console.log(`     • ${sr.skill?.name || 'Unknown'} (${sr.score_pct}%)`);
          });
        }
        
        if (building.length > 0) {
          console.log(`\n  🟡 Almost There (${building.length}):`);
          building.slice(0, 3).forEach(sr => {
            console.log(`     • ${sr.skill?.name || 'Unknown'} (${sr.score_pct}%)`);
          });
        }
        
        if (needs_dev.length > 0) {
          console.log(`\n  🔵 Developing (${needs_dev.length}):`);
          needs_dev.slice(0, 3).forEach(sr => {
            console.log(`     • ${sr.skill?.name || 'Unknown'} (${sr.score_pct}%)`);
          });
        }
      } else {
        console.log('  ⚠️  No skill results found');
      }
      
      console.log('-'.repeat(80));
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Skill data check complete!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  process.exit(0);
}

checkSkillData();
