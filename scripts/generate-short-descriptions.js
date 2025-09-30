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

console.log('📝 AI Short Description Generator');
console.log('==================================\n');

async function generateShortDescription(programName, longDescription) {
  const prompt = `Create a concise, compelling short description for this educational program.

Program Name: ${programName}
Full Description: ${longDescription || 'Not provided'}

CRITICAL REQUIREMENTS:
- EXACTLY 13-15 words
- Target ~95 characters (with spaces)
- Cut straight to the core offering - what skills/knowledge does this program provide?
- NO school names, program names, or generic lead-ins ("The program...", "This certificate...", "Nexford's...", "UMSL's...")
- NO marketing fluff ("more than an education", "advance your career", "balance work and family")
- Start with varied action verbs: Gain, Build, Develop, Learn, Explore, Acquire, Prepare, Study, etc.
- AVOID overusing "Master" - use it sparingly
- Focus on concrete skills and outcomes

GOOD EXAMPLES:
- "Gain blockchain logistics skills to enhance cybersecurity and optimize global supply chain management."
- "Build AI and cybersecurity expertise tailored for healthcare through expert-led online courses."
- "Develop data-driven decision-making skills in analytics, machine learning, and visualization techniques."

BAD EXAMPLES (DO NOT EMULATE):
- "Advance your career with a flexible, online BA in..."
- "Nexford's Bachelor of Business Administration program is more than..."
- "The Intermediate Certificate equips learners with..."

Return ONLY the short description, nothing else.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter specializing in educational program descriptions. Create concise, skills-focused descriptions in exactly 13-15 words. Cut straight to what students will learn - no fluff, no school names, no generic marketing. Use varied action verbs (Gain, Build, Develop, Learn, Explore) and focus on concrete outcomes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    const shortDesc = response.choices[0].message.content.trim();
    const wordCount = shortDesc.split(/\s+/).length;
    const charCount = shortDesc.length;
    
    return {
      description: shortDesc,
      wordCount,
      charCount
    };
    
  } catch (error) {
    console.error('Error generating description:', error);
    return null;
  }
}

async function processPrograms() {
  try {
    // Get all programs that need short descriptions
    const { data: programs, error } = await supabase
      .from('programs')
      .select('id, name, short_desc, long_desc')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching programs:', error);
      return;
    }
    
    console.log(`📋 Found ${programs.length} programs\n`);
    
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    
    for (let i = 0; i < programs.length; i++) {
      const program = programs[i];
      console.log(`\n[${i + 1}/${programs.length}] ${program.name}`);
      
      // Regenerate all descriptions with improved prompt
      // (Comment out the skip logic to regenerate everything)
      
      // Generate new short description
      const result = await generateShortDescription(
        program.name,
        program.long_desc || program.short_desc
      );
      
      if (!result) {
        console.log('   ❌ Failed to generate description');
        failed++;
        continue;
      }
      
      console.log(`   📝 Generated: "${result.description}"`);
      console.log(`   📊 Stats: ${result.wordCount} words, ${result.charCount} characters`);
      
      // Validate word count
      if (result.wordCount < 13 || result.wordCount > 15) {
        console.log(`   ⚠️  Word count out of range (${result.wordCount}), but saving anyway`);
      }
      
      // Update database
      const { error: updateError } = await supabase
        .from('programs')
        .update({ short_desc: result.description })
        .eq('id', program.id);
      
      if (updateError) {
        console.log('   ❌ Error updating database:', updateError.message);
        failed++;
        continue;
      }
      
      console.log('   ✅ Updated successfully');
      updated++;
      
      // Rate limiting - wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n==================================');
    console.log('🎉 Short Description Generation Complete!');
    console.log('==================================\n');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped (already good): ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total processed: ${programs.length}\n`);
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  }
}

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY not found in .env.local');
  process.exit(1);
}

processPrograms();
