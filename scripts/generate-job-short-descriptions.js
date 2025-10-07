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

console.log('📝 AI Short Description Generator for Jobs');
console.log('==========================================\n');

async function generateShortDescription(jobTitle, longDescription) {
  const prompt = `Create a concise, compelling short description for this occupation/job role.

Job Title: ${jobTitle}
Full Description: ${longDescription || 'Not provided'}

CRITICAL REQUIREMENTS:
- EXACTLY 13-15 words
- Target ~95 characters (with spaces)
- Cut straight to the core responsibilities - what does this role do?
- NO company names, job titles repeated, or generic lead-ins ("This role...", "The position...")
- NO marketing fluff ("exciting opportunity", "join our team", "advance your career")
- Start with varied action verbs: Manage, Develop, Coordinate, Analyze, Design, Implement, Oversee, etc.
- Focus on concrete responsibilities and skills used
- Make it informative for someone exploring this career path

GOOD EXAMPLES:
- "Manage mechanical projects from planning through execution, ensuring quality and budget compliance."
- "Analyze financial data to support strategic planning and provide insights for business decisions."
- "Coordinate patient care in surgical settings, preparing equipment and assisting medical teams."

BAD EXAMPLES (DO NOT EMULATE):
- "Join our team as a Mechanical Project Manager and..."
- "This exciting role involves managing projects..."
- "The position requires strong leadership skills and..."

Return ONLY the short description, nothing else.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter specializing in occupation descriptions. Create concise, responsibility-focused descriptions in exactly 13-15 words. Cut straight to what the role does - no fluff, no company names, no generic marketing. Use varied action verbs (Manage, Develop, Coordinate, Analyze) and focus on concrete responsibilities."
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

async function processJobs() {
  try {
    // Get all jobs/occupations that need short descriptions
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, job_kind, long_desc')
      .eq('job_kind', 'occupation') // Only process occupations, not featured roles
      .order('title');
    
    if (error) {
      console.error('❌ Error fetching jobs:', error);
      return;
    }
    
    console.log(`📋 Found ${jobs.length} occupations to process\n`);
    
    let updated = 0;
    let failed = 0;
    
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      console.log(`\n[${i + 1}/${jobs.length}] ${job.title}`);
      
      if (!job.long_desc) {
        console.log('   ⏭️  No long description available, skipping');
        continue;
      }
      
      // Generate new short description
      const result = await generateShortDescription(
        job.title,
        job.long_desc
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
      
      // Update database - add short_desc column value
      // Note: You'll need to add a short_desc column to the jobs table first
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ short_desc: result.description })
        .eq('id', job.id);
      
      if (updateError) {
        console.log('   ❌ Error updating database:', updateError.message);
        console.log('   ℹ️  Make sure the short_desc column exists in the jobs table');
        failed++;
        continue;
      }
      
      console.log('   ✅ Updated successfully');
      updated++;
      
      // Rate limiting - wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n==========================================');
    console.log('🎉 Short Description Generation Complete!');
    console.log('==========================================\n');
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total processed: ${jobs.length}\n`);
    
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

console.log('⚠️  NOTE: This script requires a short_desc column in the jobs table.');
console.log('   Run this migration first if needed:\n');
console.log('   ALTER TABLE jobs ADD COLUMN IF NOT EXISTS short_desc TEXT;\n');
console.log('Starting in 3 seconds...\n');

setTimeout(() => {
  processJobs();
}, 3000);
