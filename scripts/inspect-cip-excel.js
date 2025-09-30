const XLSX = require('xlsx');

console.log('🔍 Inspecting CIP Excel Structure\n');

const workbook = XLSX.readFile('data/cip/CIP2020_SOC2018_Crosswalk.xlsx');

console.log('📋 Sheet Names:', workbook.SheetNames);
console.log('');

// Check each sheet
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n📄 Sheet: "${sheetName}"`);
  console.log('='.repeat(50));
  
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`Rows: ${data.length}`);
  
  if (data.length > 0) {
    console.log('\nFirst 3 rows:');
    data.slice(0, 3).forEach((row, i) => {
      console.log(`Row ${i}:`, row);
    });
    
    // Show column headers
    if (data.length > 0) {
      console.log('\nColumn Headers (Row 0):');
      data[0].forEach((header, i) => {
        console.log(`  [${i}]: ${header}`);
      });
    }
  }
});
