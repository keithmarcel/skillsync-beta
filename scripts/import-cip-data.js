const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🚀 CIP Data Import Script');
console.log('==========================\n');

async function importCIPData() {
  try {
    // Read the Excel file
    console.log('📖 Reading CIP-SOC Crosswalk Excel file...');
    const workbook = XLSX.readFile('data/cip/CIP2020_SOC2018_Crosswalk.xlsx');
    
    // Use the "CIP-SOC" sheet which has the main crosswalk data
    const worksheet = workbook.Sheets['CIP-SOC'];
    
    // Convert to JSON, skipping the header row
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`✅ Loaded ${data.length} rows from CIP-SOC sheet\n`);
    
    // Extract unique CIP codes
    const cipCodesMap = new Map();
    const crosswalkData = [];
    
    console.log('🔍 Processing CIP codes and crosswalk mappings...');
    
    for (const row of data) {
      const cipCode = row['CIP2020Code'];
      const cipTitle = row['CIP2020Title'];
      const socCode = row['SOC2018Code'];
      
      if (!cipCode || !socCode || socCode === '99-9999') {
        continue; // Skip rows without required data or unmatched codes
      }
      
      // Store CIP code info
      if (!cipCodesMap.has(cipCode)) {
        // Determine level based on CIP code format
        let level = 'series'; // 2-digit
        if (cipCode.includes('.')) {
          const parts = cipCode.split('.');
          if (parts[1] && parts[1].length === 2) {
            level = 'program'; // 4-digit
          } else if (parts[1] && parts[1].length === 4) {
            level = 'specialization'; // 6-digit
          }
        }
        
        cipCodesMap.set(cipCode, {
          cip_code: cipCode,
          title: cipTitle || 'Unknown',
          level: level
        });
      }
      
      // Store crosswalk mapping
      crosswalkData.push({
        cip_code: cipCode,
        soc_code: socCode,
        source: 'NCES'
      });
    }
    
    const cipCodes = Array.from(cipCodesMap.values());
    console.log(`✅ Found ${cipCodes.length} unique CIP codes`);
    console.log(`✅ Found ${crosswalkData.length} CIP-SOC mappings\n`);
    
    // Import CIP codes
    console.log('📥 Importing CIP codes to database...');
    const { data: insertedCIPs, error: cipError } = await supabase
      .from('cip_codes')
      .upsert(cipCodes, { onConflict: 'cip_code' });
    
    if (cipError) {
      console.error('❌ Error importing CIP codes:', cipError);
      throw cipError;
    }
    
    console.log(`✅ Imported ${cipCodes.length} CIP codes\n`);
    
    // Import crosswalk data in batches (Supabase has limits)
    console.log('📥 Importing CIP-SOC crosswalk mappings...');
    const batchSize = 1000;
    let imported = 0;
    
    for (let i = 0; i < crosswalkData.length; i += batchSize) {
      const batch = crosswalkData.slice(i, i + batchSize);
      const { error: crossError } = await supabase
        .from('cip_soc_crosswalk')
        .upsert(batch, { onConflict: 'cip_code,soc_code' });
      
      if (crossError) {
        console.error(`❌ Error importing batch ${i / batchSize + 1}:`, crossError);
        throw crossError;
      }
      
      imported += batch.length;
      console.log(`   Imported ${imported}/${crosswalkData.length} mappings...`);
    }
    
    console.log(`✅ Imported ${crosswalkData.length} crosswalk mappings\n`);
    
    // Verify import
    console.log('🔍 Verifying import...');
    const { count: cipCount } = await supabase
      .from('cip_codes')
      .select('*', { count: 'exact', head: true });
    
    const { count: crossCount } = await supabase
      .from('cip_soc_crosswalk')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Database now has ${cipCount} CIP codes`);
    console.log(`✅ Database now has ${crossCount} CIP-SOC mappings\n`);
    
    // Show sample data
    console.log('📊 Sample CIP codes:');
    const { data: sampleCIPs } = await supabase
      .from('cip_codes')
      .select('*')
      .limit(5);
    
    sampleCIPs?.forEach(cip => {
      console.log(`   ${cip.cip_code} - ${cip.title} (${cip.level})`);
    });
    
    console.log('\n📊 Sample crosswalk mappings:');
    const { data: sampleCross } = await supabase
      .from('cip_soc_crosswalk')
      .select('*')
      .limit(5);
    
    sampleCross?.forEach(cross => {
      console.log(`   ${cross.cip_code} → ${cross.soc_code}`);
    });
    
    console.log('\n🎉 CIP data import complete!');
    console.log('==========================\n');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importCIPData();
