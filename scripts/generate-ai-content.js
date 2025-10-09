/**
 * Generate AI Content for Occupations
 * 
 * This script generates core_responsibilities and related_job_titles
 * for all occupations that are missing this data
 */

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

async function generateCoreResponsibilities(occupationTitle, socCode, tasks, skills) {
  try {
    const tasksContext = tasks?.slice(0, 5).map(t => t.TaskDescription).join('\n- ') || 'Not available';
    const skillsContext = skills?.slice(0, 8).map(s => s.skill?.name || s.name).join(', ') || 'Not available';

    const prompt = `Generate 5-7 core responsibilities for a ${occupationTitle} (SOC: ${socCode}).

Context:
- Key tasks: ${tasksContext}
- Required skills: ${skillsContext}

Format as concise bullet points (without bullet symbols) focusing on:
1. Key accountabilities and outcomes
2. Strategic responsibilities beyond daily tasks
3. Leadership or coordination duties
4. Quality and compliance responsibilities
5. Continuous improvement activities

Return ONLY the responsibility statements, one per line, without numbering or bullets.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in occupational analysis and job descriptions. Generate professional, accurate core responsibilities.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';
    const responsibilities = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+\./))
      .slice(0, 7);

    return responsibilities;
  } catch (error) {
    console.error('Error generating responsibilities:', error);
    return null;
  }
}

async function generateRelatedJobTitles(occupationTitle, socCode) {
  try {
    const prompt = `Generate 6-8 related job titles for "${occupationTitle}" (SOC: ${socCode}).

Include variations in:
1. Seniority levels (Junior, Senior, Lead, Principal)
2. Specializations within the field
3. Industry-specific variations
4. Alternative common titles for the same role

Return ONLY the job titles, one per line, without numbering or explanations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in occupational classifications and job market analysis. Generate accurate, relevant job titles.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '';
    const titles = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+\./))
      .slice(0, 8);

    return titles;
  } catch (error) {
    console.error('Error generating related titles:', error);
    return null;
  }
}

async function generateAIContent() {
  try {
    console.log('Starting AI content generation...\n');
    
    // Get all occupations - we'll filter in JS for better control
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, soc_code, core_responsibilities, related_job_titles')
      .eq('job_kind', 'occupation');
    
    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return;
    }
    
    console.log(`Found ${jobs.length} total occupations\n`);
    
    // Filter for jobs that need AI content
    const jobsNeedingContent = jobs.filter(job => {
      const needsResponsibilities = !job.core_responsibilities || 
                                   !Array.isArray(job.core_responsibilities) || 
                                   job.core_responsibilities.length === 0;
      const needsTitles = !job.related_job_titles || 
                         !Array.isArray(job.related_job_titles) || 
                         job.related_job_titles.length === 0;
      return needsResponsibilities || needsTitles;
    });
    
    console.log(`${jobsNeedingContent.length} occupations need AI content\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const job of jobsNeedingContent) {
      try {
        console.log(`\n📝 Processing: ${job.title} (${job.soc_code})`);
        
        const updates = {};
        
        // Generate core responsibilities if missing
        const needsResponsibilities = !job.core_responsibilities || 
                                     !Array.isArray(job.core_responsibilities) || 
                                     job.core_responsibilities.length === 0;
        if (needsResponsibilities) {
          console.log('   Generating core responsibilities...');
          const responsibilities = await generateCoreResponsibilities(
            job.title,
            job.soc_code,
            null, // We don't have tasks in this context
            null  // We don't have skills in this context
          );
          
          if (responsibilities && responsibilities.length > 0) {
            updates.core_responsibilities = responsibilities;
            console.log(`   ✓ Generated ${responsibilities.length} responsibilities`);
          }
        }
        
        // Generate related job titles if missing
        const needsTitles = !job.related_job_titles || 
                           !Array.isArray(job.related_job_titles) || 
                           job.related_job_titles.length === 0;
        if (needsTitles) {
          console.log('   Generating related job titles...');
          const titles = await generateRelatedJobTitles(job.title, job.soc_code);
          
          if (titles && titles.length > 0) {
            updates.related_job_titles = titles;
            console.log(`   ✓ Generated ${titles.length} related titles`);
          }
        }
        
        // Update database if we have any updates
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('jobs')
            .update(updates)
            .eq('id', job.id);
          
          if (updateError) {
            console.error(`   ✗ Error updating ${job.title}:`, updateError);
            errorCount++;
          } else {
            console.log(`   ✅ Updated successfully`);
            successCount++;
          }
        } else {
          console.log('   ⊘ No updates needed');
        }
        
        // Rate limiting - wait 2 seconds between API calls
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing ${job.title}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n\n✅ AI content generation complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Skipped: ${jobsNeedingContent.length - successCount - errorCount}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the script
generateAIContent()
  .then(() => {
    console.log('\nScript finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
