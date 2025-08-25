const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Use local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importPinellasData() {
  const results = [];
  
  console.log('Reading CSV file...');
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./docs/documentation/Pinellas-Hillsborough_Top_30_Filled.csv')
      .pipe(csv())
      .on('data', (data) => {
        // Transform CSV data to match our jobs table schema
        const jobData = {
          job_kind: 'high_demand', // Use valid enum value
          title: data.occupation_name,
          soc_code: data.soc_code,
          category: data.category,
          long_desc: data.description_long,
          median_wage_usd: parseFloat(data.median_wage_value) * (data.median_wage_unit === 'hourly' ? 2080 : 1), // Convert hourly to annual
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
          // Insert data into Supabase
          console.log('Inserting data into Supabase...');
          
          const { data, error } = await supabase
            .from('jobs')
            .insert(results);

          if (error) {
            console.error('Error inserting data:', error);
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

// Run the import
importPinellasData()
  .then(() => {
    console.log('Import completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
