const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeDuplicates() {
  console.log('Fetching high-demand jobs...');
  
  const {data: jobs, error} = await supabase
    .from('jobs')
    .select('*')
    .eq('job_kind', 'high_demand')
    .order('id');
    
  if (error) {
    console.error('Error fetching jobs:', error);
    return;
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
}

removeDuplicates()
  .then(() => {
    console.log('Duplicate removal completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
