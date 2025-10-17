/**
 * Use AI to intelligently crosswalk programs to Power Design roles
 * based on program names, descriptions, and role requirements
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

async function aiCrosswalk() {
  console.log('🤖 AI-Powered Program-to-Role Crosswalking\n');
  console.log('='.repeat(70));

  // 1. Get Power Design roles
  console.log('\n📋 Fetching Power Design Roles...\n');
  const { data: roles } = await supabase
    .from('jobs')
    .select('id, title, soc_code, short_desc, long_desc')
    .eq('company_id', 'e5848012-89df-449e-855a-1834e9389656')
    .eq('job_kind', 'featured_role')
    .eq('status', 'published');

  console.log(`✅ Found ${roles.length} roles\n`);

  // 2. Get sample programs (limit to avoid token limits)
  console.log('📚 Fetching Programs...\n');
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, discipline, program_type, short_desc')
    .eq('status', 'published')
    .limit(50); // Start with 50 for testing

  console.log(`✅ Found ${programs.length} programs\n`);

  // 3. For each role, use AI to find relevant programs
  console.log('🔗 AI Analysis Starting...\n');
  console.log('='.repeat(70));

  for (const role of roles) {
    console.log(`\n🎯 Role: ${role.title}`);
    console.log(`   SOC: ${role.soc_code}`);
    console.log(`   Description: ${role.short_desc?.substring(0, 100)}...`);

    const prompt = `You are an education and workforce development expert. Analyze which education programs would be most relevant for preparing someone for this role.

ROLE:
Title: ${role.title}
SOC Code: ${role.soc_code}
Description: ${role.short_desc || role.long_desc || 'N/A'}

AVAILABLE PROGRAMS:
${programs.map((p, i) => `${i + 1}. ${p.name} (${p.discipline || 'N/A'}) - ${p.short_desc?.substring(0, 80) || 'No description'}`).join('\n')}

TASK:
Identify the top 3-5 programs that would best prepare someone for this role. Consider:
- Technical skills alignment
- Industry relevance
- Educational level appropriateness
- Career pathway logic

Return ONLY a JSON array of program numbers (1-${programs.length}) in order of relevance.
Example: [5, 12, 23]

If no programs are relevant, return an empty array: []`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200
      });

      let content = completion.choices[0].message.content;
      
      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const programIndices = JSON.parse(content);

      if (programIndices.length > 0) {
        console.log(`\n   ✅ AI Recommended ${programIndices.length} programs:`);
        programIndices.forEach(idx => {
          const program = programs[idx - 1];
          if (program) {
            console.log(`      • ${program.name}`);
            console.log(`        ${program.discipline || 'N/A'} - ${program.program_type || 'N/A'}`);
          }
        });
      } else {
        console.log(`\n   ⚠️  AI found no relevant programs`);
      }

    } catch (error) {
      console.error(`   ❌ AI analysis failed:`, error.message);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n' + '='.repeat(70));
  console.log('✅ AI Crosswalking Complete!\n');
}

aiCrosswalk()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
