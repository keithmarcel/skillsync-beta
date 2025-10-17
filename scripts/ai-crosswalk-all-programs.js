/**
 * AI-Powered Program-to-Role Crosswalk - Full Analysis
 * Analyzes ALL 222 programs and selects top 6 per role with confidence scores
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function fullCrosswalk() {
  console.log('🤖 AI-Powered Program-to-Role Crosswalk - FULL ANALYSIS\n');
  console.log('='.repeat(70));

  // 1. Get Power Design roles
  console.log('\n📋 Fetching Power Design Roles...\n');
  const { data: roles } = await supabase
    .from('jobs')
    .select('id, title, soc_code, short_desc, long_desc, company:companies(name, industry)')
    .eq('company_id', 'e5848012-89df-449e-855a-1834e9389656')
    .eq('job_kind', 'featured_role')
    .eq('status', 'published');

  console.log(`✅ Found ${roles.length} roles\n`);

  // 2. Get ALL programs
  console.log('📚 Fetching ALL Programs...\n');
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, discipline, program_type, short_desc, duration_text')
    .eq('status', 'published');

  console.log(`✅ Found ${programs.length} programs\n`);

  // 3. Process in batches (50 programs at a time to avoid token limits)
  const batchSize = 50;
  const allRecommendations = [];

  for (const role of roles) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎯 Role: ${role.title}`);
    console.log(`   SOC: ${role.soc_code}`);
    console.log(`   Company: ${role.company.name} (${role.company.industry})`);
    
    const roleRecommendations = [];

    // Process programs in batches
    for (let i = 0; i < programs.length; i += batchSize) {
      const batch = programs.slice(i, i + batchSize);
      console.log(`\n   Analyzing programs ${i + 1}-${Math.min(i + batchSize, programs.length)}...`);

      const prompt = `You are an education and workforce development expert. Analyze which programs would best prepare someone for this role.

ROLE:
Title: ${role.title}
SOC Code: ${role.soc_code}
Company: ${role.company.name} - ${role.company.industry}
Description: ${role.short_desc || role.long_desc || 'N/A'}

PROGRAMS TO EVALUATE:
${batch.map((p, idx) => `${i + idx + 1}. ${p.name}
   Discipline: ${p.discipline || 'N/A'}
   Type: ${p.program_type || 'N/A'}
   Duration: ${p.duration_text || 'N/A'}
   Description: ${p.short_desc?.substring(0, 100) || 'No description'}`).join('\n\n')}

TASK:
For each program that is relevant to this role, return a JSON object with:
- programNumber: the program number (${i + 1}-${i + batch.length})
- confidence: score from 0.0 to 1.0 (how confident you are this program prepares for the role)
- reasoning: brief explanation (1-2 sentences) of why it's relevant

Consider:
- Technical skills alignment
- Industry relevance (construction/electrical/mechanical/project management)
- Educational level appropriateness
- Career pathway logic
- Practical application to role

Return ONLY a JSON array of relevant programs, ordered by confidence (highest first).
Example: [{"programNumber": 5, "confidence": 0.95, "reasoning": "Direct PM certification"}, ...]

If no programs are relevant, return: []`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1500
        });

        let content = completion.choices[0].message.content;
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const batchResults = JSON.parse(content);
        
        // Add to role recommendations
        batchResults.forEach(result => {
          const program = programs[result.programNumber - 1];
          if (program) {
            roleRecommendations.push({
              programId: program.id,
              programName: program.name,
              confidence: result.confidence,
              reasoning: result.reasoning
            });
          }
        });

        console.log(`      Found ${batchResults.length} relevant programs in this batch`);

      } catch (error) {
        console.error(`      ❌ Batch analysis failed:`, error.message);
      }

      // Rate limiting between batches
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Sort by confidence and take top 6
    roleRecommendations.sort((a, b) => b.confidence - a.confidence);
    const top6 = roleRecommendations.slice(0, 6);

    console.log(`\n   ✅ Top 6 Programs for ${role.title}:`);
    top6.forEach((rec, idx) => {
      console.log(`      ${idx + 1}. ${rec.programName}`);
      console.log(`         Confidence: ${(rec.confidence * 100).toFixed(0)}%`);
      console.log(`         Reasoning: ${rec.reasoning}`);
    });

    // Store for database insertion
    allRecommendations.push({
      roleId: role.id,
      roleTitle: role.title,
      programs: top6
    });
  }

  // 4. Insert into database
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('💾 Inserting Crosswalk Data into Database...\n');

  let totalInserted = 0;
  for (const roleRec of allRecommendations) {
    console.log(`   Inserting ${roleRec.programs.length} programs for ${roleRec.roleTitle}...`);

    for (const prog of roleRec.programs) {
      const { error } = await supabase
        .from('role_program_crosswalk')
        .upsert({
          job_id: roleRec.roleId,
          program_id: prog.programId,
          confidence_score: prog.confidence,
          match_reasoning: prog.reasoning,
          recommended_for: ['role_preparation', 'upskilling'],
          skill_alignment_count: 0 // Will be calculated later if needed
        }, {
          onConflict: 'job_id,program_id'
        });

      if (error) {
        console.error(`      ❌ Error inserting:`, error.message);
      } else {
        totalInserted++;
      }
    }
  }

  console.log(`\n   ✅ Successfully inserted ${totalInserted} crosswalk entries`);

  // 5. Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 CROSSWALK SUMMARY\n');
  console.log(`   Roles Analyzed: ${roles.length}`);
  console.log(`   Programs Evaluated: ${programs.length}`);
  console.log(`   Crosswalk Entries Created: ${totalInserted}`);
  console.log(`   Average Programs per Role: ${(totalInserted / roles.length).toFixed(1)}`);
  console.log(`\n✅ AI Crosswalking Complete!`);
  console.log(`\n💡 Next: Role detail pages will now show these recommended programs`);
  console.log(`   Future: Gap analysis will use this for personalized recommendations`);
  console.log(`\n${'='.repeat(70)}`);
}

fullCrosswalk()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
