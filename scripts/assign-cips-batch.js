const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('🤖 AI-Assisted CIP Assignment');
console.log('==============================\n');

async function suggestCIPCodes(programName, programDescription, programType, discipline) {
  const context = `
Program Name: ${programName}
Program Type: ${programType || 'Unknown'}
Discipline: ${discipline || 'Unknown'}
Description: ${programDescription || 'Not provided'}

Task: Suggest the 3 most appropriate CIP 2020 codes for this educational program.
Use 6-digit CIP codes (format: ##.####).
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cheaper, faster, higher rate limits
      messages: [
        {
          role: "system",
          content: `You are a CIP code classification expert. Suggest 6-digit CIP 2020 codes.

IMPORTANT: Return ONLY valid JSON, no other text.

Format:
{
  "suggestions": [
    {
      "cipCode": "11.0101",
      "cipTitle": "Computer and Information Sciences, General.",
      "confidence": 95,
      "reasoning": "Direct match for program content"
    }
  ]
}

Confidence guidelines:
- 90-100: Exact match
- 75-89: Strong match
- 50-74: Reasonable match
- Below 50: Weak match`
        },
        {
          role: "user",
          content: context
        }
      ],
      temperature: 0.3,
      max_tokens: 400
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions":[]}');
    return result.suggestions || [];
    
  } catch (error) {
    console.error('Error getting CIP suggestions:', error);
    return [];
  }
}

async function validateCIPInDatabase(cipCode) {
  const { data } = await supabase
    .from('cip_codes')
    .select('cip_code, title')
    .eq('cip_code', cipCode)
    .single();
  
  return data;
}

async function batchAssignCIPs() {
  try {
    // Get all programs without CIP codes
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .is('cip_code', null)
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching programs:', error);
      return;
    }
    
    console.log(`📋 Found ${programs.length} programs without CIP codes\n`);
    
    let autoAssigned = 0;
    let needsReview = 0;
    let failed = 0;
    
    for (let i = 0; i < programs.length; i++) {
      const program = programs[i];
      console.log(`\n[${i + 1}/${programs.length}] Processing: "${program.name}"`);
      
      // Get AI suggestions
      const suggestions = await suggestCIPCodes(
        program.name,
        program.long_desc || program.short_desc,
        program.program_type,
        program.discipline
      );
      
      if (suggestions.length === 0) {
        console.log('   ❌ No suggestions returned');
        failed++;
        continue;
      }
      
      const topSuggestion = suggestions[0];
      console.log(`   🤖 Top suggestion: ${topSuggestion.cipCode} - ${topSuggestion.cipTitle}`);
      console.log(`   📊 Confidence: ${topSuggestion.confidence}%`);
      console.log(`   💭 Reasoning: ${topSuggestion.reasoning}`);
      
      // Validate CIP exists in our database
      const cipData = await validateCIPInDatabase(topSuggestion.cipCode);
      
      if (!cipData) {
        console.log(`   ⚠️  CIP ${topSuggestion.cipCode} not found in database`);
        
        // Try alternative format (some CIPs might be stored differently)
        const altCipCode = topSuggestion.cipCode.replace('.', '');
        const altCipData = await validateCIPInDatabase(altCipCode);
        
        if (!altCipData) {
          console.log('   ❌ CIP validation failed');
          failed++;
          continue;
        }
      }
      
      // Auto-assign (all approved by default per user request)
      const { error: updateError } = await supabase
        .from('programs')
        .update({ 
          cip_code: topSuggestion.cipCode,
          cip_assignment_confidence: topSuggestion.confidence,
          cip_assignment_method: 'ai_auto',
          cip_approved: true, // All approved by default for testing
          cip_suggestions: suggestions
        })
        .eq('id', program.id);
      
      if (updateError) {
        console.log('   ❌ Error updating program:', updateError.message);
        failed++;
        continue;
      }
      
      if (topSuggestion.confidence >= 75) {
        console.log('   ✅ Auto-assigned (high confidence)');
        autoAssigned++;
      } else {
        console.log('   ⚠️  Auto-assigned (medium confidence - may need review)');
        needsReview++;
      }
      
      // Rate limiting - wait 2 seconds between API calls to avoid hitting limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n==============================');
    console.log('🎉 Batch CIP Assignment Complete!');
    console.log('==============================\n');
    console.log(`✅ Auto-assigned (high confidence): ${autoAssigned}`);
    console.log(`⚠️  Auto-assigned (medium confidence): ${needsReview}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total processed: ${programs.length}\n`);
    
    // Verify results
    const { count: assignedCount } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .not('cip_code', 'is', null);
    
    console.log(`✅ Programs now with CIP codes: ${assignedCount}`);
    
  } catch (error) {
    console.error('❌ Batch assignment failed:', error);
    process.exit(1);
  }
}

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY not found in .env.local');
  console.error('Please add your OpenAI API key to .env.local:');
  console.error('OPENAI_API_KEY=sk-...');
  process.exit(1);
}

batchAssignCIPs();
