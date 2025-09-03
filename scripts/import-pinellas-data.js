const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use remote Supabase instance from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function importPinellasData() {
  const results = [];
  
  console.log('Reading CSV file...');
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./docs/documentation/Pinellas-Hillsborough_Top_30_Filled.csv')
      .pipe(csv())
      .on('data', (data) => {
        // Debug: log the actual data being parsed
        console.log('Parsing row:', data.occupation_name, 'wage:', data.median_wage_value, 'unit:', data.median_wage_unit);
        
        // Transform CSV data to match our jobs table schema
        const jobData = {
          job_kind: 'occupation',
          education_level: data['Typical Education'] || 'Varies',
          employment_outlook: 'High Demand',
          is_featured: false,
          title: data.occupation_name,
          soc_code: data.soc_code,
          category: data.category,
          long_desc: data.description_long,
          median_wage_usd: Math.round(parseFloat(data.median_wage_value) * (data.median_wage_unit === 'hourly' ? 2080 : 1)), // Convert hourly to annual
          skills_count: parseInt(data.skills_count) || 0,
          location_city: 'Tampa Bay',
          location_state: 'FL',
          job_type: 'Full-time'
        };

        console.log('Transformed job:', jobData.title, 'annual wage:', jobData.median_wage_usd);
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
