/**
 * Populate CIP-SOC Crosswalk Table
 * 
 * This script populates the cip_soc_crosswalk table with official NCES data.
 * 
 * Data Source: https://nces.ed.gov/ipeds/cipcode/resources.aspx?y=56
 * 
 * Run after updating CIP codes in programs table to ensure dynamic crosswalks work.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Sample CIP-SOC mappings
 * TODO: Replace with full NCES dataset
 * 
 * Format: { cip_code, cip_title, soc_code, soc_title, match_strength }
 */
const CIP_SOC_MAPPINGS = [
  // Computer and Information Sciences (CIP 11.xxxx)
  { cip_code: '11.0101', cip_title: 'Computer and Information Sciences, General', soc_code: '15-1252.00', soc_title: 'Software Developers', match_strength: 'primary' },
  { cip_code: '11.0101', cip_title: 'Computer and Information Sciences, General', soc_code: '15-1211.00', soc_title: 'Computer Systems Analysts', match_strength: 'secondary' },
  { cip_code: '11.0201', cip_title: 'Computer Programming', soc_code: '15-1252.00', soc_title: 'Software Developers', match_strength: 'primary' },
  { cip_code: '11.0701', cip_title: 'Computer Science', soc_code: '15-1252.00', soc_title: 'Software Developers', match_strength: 'primary' },
  { cip_code: '11.0701', cip_title: 'Computer Science', soc_code: '15-1299.08', soc_title: 'Computer Scientists', match_strength: 'primary' },
  
  // Business Administration (CIP 52.xxxx)
  { cip_code: '52.0201', cip_title: 'Business Administration and Management', soc_code: '11-1021.00', soc_title: 'General and Operations Managers', match_strength: 'primary' },
  { cip_code: '52.0201', cip_title: 'Business Administration and Management', soc_code: '11-2022.00', soc_title: 'Sales Managers', match_strength: 'secondary' },
  { cip_code: '52.0201', cip_title: 'Business Administration and Management', soc_code: '13-1111.00', soc_title: 'Management Analysts', match_strength: 'secondary' },
  { cip_code: '52.0301', cip_title: 'Accounting', soc_code: '13-2011.00', soc_title: 'Accountants and Auditors', match_strength: 'primary' },
  { cip_code: '52.0301', cip_title: 'Accounting', soc_code: '43-3031.00', soc_title: 'Bookkeeping, Accounting, and Auditing Clerks', match_strength: 'secondary' },
  { cip_code: '52.0801', cip_title: 'Finance, General', soc_code: '13-2051.00', soc_title: 'Financial Analysts', match_strength: 'primary' },
  { cip_code: '52.0801', cip_title: 'Finance, General', soc_code: '11-3031.00', soc_title: 'Financial Managers', match_strength: 'secondary' },
  
  // Health Professions (CIP 51.xxxx)
  { cip_code: '51.0801', cip_title: 'Medical/Clinical Assistant', soc_code: '31-9092.00', soc_title: 'Medical Assistants', match_strength: 'primary' },
  { cip_code: '51.0909', cip_title: 'Surgical Technology/Technologist', soc_code: '29-2055.00', soc_title: 'Surgical Technologists', match_strength: 'primary' },
  { cip_code: '51.0000', cip_title: 'Health Services/Allied Health/Health Sciences, General', soc_code: '11-9111.00', soc_title: 'Medical and Health Services Managers', match_strength: 'secondary' },
  
  // Engineering (CIP 14.xxxx)
  { cip_code: '14.0101', cip_title: 'Engineering, General', soc_code: '17-2199.00', soc_title: 'Engineers, All Other', match_strength: 'primary' },
  { cip_code: '14.0901', cip_title: 'Computer Engineering', soc_code: '15-1252.00', soc_title: 'Software Developers', match_strength: 'secondary' },
  { cip_code: '14.0901', cip_title: 'Computer Engineering', soc_code: '17-2061.00', soc_title: 'Computer Hardware Engineers', match_strength: 'primary' },
  
  // Construction Trades (CIP 46.xxxx)
  { cip_code: '46.0000', cip_title: 'Construction Trades, General', soc_code: '47-1011.00', soc_title: 'First-Line Supervisors of Construction Trades', match_strength: 'primary' },
  { cip_code: '46.0301', cip_title: 'Electrical and Power Transmission Installation', soc_code: '47-2111.00', soc_title: 'Electricians', match_strength: 'primary' },
  { cip_code: '46.0000', cip_title: 'Construction Trades, General', soc_code: '11-9021.00', soc_title: 'Construction Managers', match_strength: 'secondary' },
  
  // Add more mappings as needed...
  // Full NCES dataset has ~1,000+ mappings
];

async function populateCrosswalk() {
  console.log('🔄 Populating CIP-SOC Crosswalk Table\n');
  console.log('='.repeat(70));
  
  // 1. Clear existing data
  console.log('\n🗑️  Clearing existing crosswalk data...');
  const { error: deleteError } = await supabase
    .from('cip_soc_crosswalk')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (deleteError) {
    console.error('❌ Error clearing data:', deleteError);
    return;
  }
  console.log('✅ Cleared existing data');
  
  // 2. Insert new mappings
  console.log(`\n📥 Inserting ${CIP_SOC_MAPPINGS.length} CIP-SOC mappings...`);
  
  const { data, error } = await supabase
    .from('cip_soc_crosswalk')
    .insert(CIP_SOC_MAPPINGS)
    .select();
  
  if (error) {
    console.error('❌ Error inserting mappings:', error);
    return;
  }
  
  console.log(`✅ Inserted ${data.length} mappings`);
  
  // 3. Show summary by match strength
  console.log('\n📊 Summary by Match Strength:');
  
  const { data: summary } = await supabase
    .from('cip_soc_crosswalk')
    .select('match_strength');
  
  const counts = summary?.reduce((acc, row) => {
    acc[row.match_strength] = (acc[row.match_strength] || 0) + 1;
    return acc;
  }, {});
  
  console.log('  Primary:', counts?.primary || 0);
  console.log('  Secondary:', counts?.secondary || 0);
  console.log('  Tertiary:', counts?.tertiary || 0);
  
  // 4. Show sample mappings
  console.log('\n📋 Sample Mappings:');
  const { data: samples } = await supabase
    .from('cip_soc_crosswalk')
    .select('*')
    .limit(5);
  
  samples?.forEach(m => {
    console.log(`  ${m.cip_code} → ${m.soc_code} (${m.match_strength})`);
    console.log(`    ${m.cip_title} → ${m.soc_title}`);
  });
  
  console.log('\n✅ CIP-SOC Crosswalk populated successfully!');
  console.log('\n💡 Next Steps:');
  console.log('  1. Add more NCES mappings to CIP_SOC_MAPPINGS array');
  console.log('  2. Run migration: supabase db push');
  console.log('  3. Test dynamic crosswalk queries');
}

populateCrosswalk().catch(console.error);
