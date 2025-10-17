/**
 * Enrich Power Design roles with BLS wage data and other enrichment
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Import BLS API service
const { BLSApiService } = require('../src/lib/services/bls-api.ts');

async function enrichRoles() {
  console.log('🔧 Enriching Power Design roles with BLS data...\n');
  
  const blsApi = new BLSApiService();
  
  const roles = [
    {
      id: '42d898f5-06d3-465d-81dc-2d8f49c25d61',
      title: 'Assistant Property Manager',
      socCode: '11-9141.00'
    },
    {
      id: '4dd6bc75-f6a0-4d68-9d69-e18a500a9746',
      title: 'Business Process Engineer',
      socCode: '17-2112.00'
    }
  ];
  
  for (const role of roles) {
    console.log(`📋 ${role.title} (${role.socCode})`);
    
    try {
      // Get BLS wage data for Tampa MSA
      const wageData = await blsApi.getWageData(role.socCode, '45300'); // Tampa MSA code
      
      if (wageData) {
        console.log(`  💰 Median wage: $${wageData.medianWage?.toLocaleString()}`);
        console.log(`  📊 Employment: ${wageData.employmentLevel?.toLocaleString()}`);
        
        // Update the job with wage data
        await supabase
          .from('jobs')
          .update({
            median_salary: wageData.medianWage,
            salary_min: wageData.percentile10,
            salary_max: wageData.percentile90
          })
          .eq('id', role.id);
        
        console.log('  ✅ Updated wage data\n');
      } else {
        console.log('  ⚠️  No wage data found\n');
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('✅ Enrichment complete!');
}

enrichRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
