const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Use local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeDuplicates() {
  console.log('Step 1: Removing duplicate jobs...');
  
  const {data: jobs, error} = await supabase
    .from('jobs')
    .select('*')
    .eq('job_kind', 'high_demand')
    .order('id');
    
  if (error) {
    console.error('Error fetching jobs:', error);
    return false;
  }
  
  console.log(`Found ${jobs.length} high-demand jobs`);
  
  // Group by title
  const titleGroups = {};
  jobs.forEach(job => {
    if (!titleGroups[job.title]) {
      titleGroups[job.title] = [];
    }
    titleGroups[job.title].push(job);
  });
  
  // Find and delete duplicates
  let deletedCount = 0;
  for (const [title, jobGroup] of Object.entries(titleGroups)) {
    if (jobGroup.length > 1) {
      console.log(`Found ${jobGroup.length} duplicates for: ${title}`);
      
      // Keep the first one, delete the rest
      const toDelete = jobGroup.slice(1);
      
      for (const job of toDelete) {
        const {error: delError} = await supabase
          .from('jobs')
          .delete()
          .eq('id', job.id);
          
        if (delError) {
          console.error(`Error deleting job ${job.id}:`, delError);
        } else {
          deletedCount++;
        }
      }
    }
  }
  
  console.log(`Successfully deleted ${deletedCount} duplicate jobs`);
  return true;
}

async function importPinellasData() {
  console.log('Step 2: Importing/updating Pinellas data...');
  
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./docs/documentation/Pinellas-Hillsborough_Top_30_Filled.csv')
      .pipe(csv())
      .on('data', (data) => {
        // Transform CSV data to match our jobs table schema
        const jobData = {
          job_kind: 'high_demand',
          title: data.occupation_name,
          soc_code: data.soc_code,
          category: data.category,
          long_desc: data.description_long,
          median_wage_usd: parseFloat(data.median_wage_value) * (data.median_wage_unit === 'hourly' ? 2080 : 1),
          skills_count: parseInt(data.skills_count) || 0,
          location_city: 'Tampa Bay',
          location_state: 'FL',
          job_type: 'Full-time'
        };

        results.push(jobData);
      })
      .on('end', async () => {
        console.log(`Parsed ${results.length} records from CSV`);
        
        try {
          // Upsert data into Supabase to avoid duplicates
          console.log('Upserting data into Supabase...');
          
          const { data, error } = await supabase
            .from('jobs')
            .upsert(results, { onConflict: 'soc_code' });

          if (error) {
            console.error('Error upserting data:', error);
            reject(error);
          } else {
            console.log(`Successfully imported ${results.length} Pinellas-Hillsborough occupation records`);
            resolve(data);
          }
        } catch (err) {
          console.error('Error during import:', err);
          reject(err);
        }
      })
      .on('error', reject);
  });
}

async function fixDuplicates() {
  try {
    console.log('🔧 Starting duplicate fix process...\n');
    
    // Step 1: Remove existing duplicates
    const cleanupSuccess = await removeDuplicates();
    if (!cleanupSuccess) {
      throw new Error('Failed to remove duplicates');
    }
    
    console.log('\n');
    
    // Step 2: Import/update data with upsert
    await importPinellasData();
    
    console.log('\n✅ Duplicate fix process completed successfully!');
    console.log('You can now check the jobs page - duplicates should be resolved.');
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixDuplicates()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Process failed:', error);
    process.exit(1);
  });
