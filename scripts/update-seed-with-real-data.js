const fs = require('fs');
const csv = require('csv-parser');

async function updateSeedFile() {
  const results = [];
  
  console.log('Reading CSV file...');
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./docs/documentation/Pinellas-Hillsborough_Top_30_Filled.csv')
      .pipe(csv())
      .on('data', (data) => {
        const annualWage = Math.round(parseFloat(data.median_wage_value) * (data.median_wage_unit === 'hourly' ? 2080 : 1));
        
        const jobData = {
          title: data.occupation_name,
          soc_code: data.soc_code,
          category: data.category,
          long_desc: data.description_long,
          median_wage_usd: annualWage,
          skills_count: parseInt(data.skills_count) || 0
        };

        results.push(jobData);
      })
      .on('end', async () => {
        console.log(`Parsed ${results.length} records from CSV`);
        
        // Read current seed file
        let seedContent = fs.readFileSync('./supabase/seed.sql', 'utf8');
        
        // Find and replace the high_demand jobs section
        const startMarker = "-- 🚨 API INTEGRATION NEEDED: median_wage_usd, long_desc, projected_openings, growth_outlook";
        const endMarker = "-- Insert job_skills relationships for high-demand occupations";
        
        const startIndex = seedContent.indexOf(startMarker);
        const endIndex = seedContent.indexOf(endMarker);
        
        if (startIndex === -1 || endIndex === -1) {
          console.error('Could not find markers in seed file');
          reject(new Error('Markers not found'));
          return;
        }
        
        // Generate new SQL inserts
        let newJobsSQL = startMarker + '\n';
        newJobsSQL += 'INSERT INTO jobs (id, job_kind, title, soc_code, category, long_desc, median_wage_usd, skills_count, job_type, location_city, location_state) VALUES\n';
        
        results.forEach((job, index) => {
          const id = `880e8400-e29b-41d4-a716-44665544${String(index + 1).padStart(4, '0')}`;
          const comma = index === results.length - 1 ? ';' : ',';
          
          newJobsSQL += `('${id}', 'high_demand', '${job.title.replace(/'/g, "''")}', '${job.soc_code}', '${job.category}', '${job.long_desc.replace(/'/g, "''")}', ${job.median_wage_usd}, ${job.skills_count}, 'Full-time', 'Tampa Bay', 'FL')${comma}\n`;
        });
        
        newJobsSQL += '\n';
        
        // Replace the section
        const newSeedContent = seedContent.substring(0, startIndex) + newJobsSQL + seedContent.substring(endIndex);
        
        // Write back to file
        fs.writeFileSync('./supabase/seed.sql', newSeedContent);
        console.log('Updated seed.sql with real data');
        
        resolve();
      })
      .on('error', reject);
  });
}

updateSeedFile()
  .then(() => {
    console.log('Seed file update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Update failed:', error);
    process.exit(1);
  });
