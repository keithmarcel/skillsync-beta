#!/usr/bin/env node
/**
 * Import OEWS May 2024 Data from BLS Flat Files
 * 
 * Downloads and imports wage data for:
 * - Tampa-St. Petersburg-Clearwater MSA (45300)
 * - Florida State (12)
 * - National (0000)
 * 
 * Data Source: https://www.bls.gov/oes/tables.htm
 * Updates: bls_wage_data table with May 2024 OEWS data
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const https = require('https')
const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// OEWS Data URLs (May 2024)
const DATA_URLS = {
  national: 'https://www.bls.gov/oes/special.requests/oesm24nat.zip',
  state: 'https://www.bls.gov/oes/special.requests/oesm24st.zip',
  msa: 'https://www.bls.gov/oes/special.requests/oesm24ma.zip'
}

// Area codes we care about
const AREAS = {
  tampa: { code: '45300', name: 'Tampa-St. Petersburg-Clearwater, FL', type: 'msa' },
  florida: { code: '12', name: 'Florida', type: 'state' },
  national: { code: '0000000', name: 'United States', type: 'national' }
}

const DATA_DIR = path.join(__dirname, '../temp/oews-data')

/**
 * Download file from URL
 */
async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath)
    https.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(filepath, () => {})
      reject(err)
    })
  })
}

/**
 * Extract zip file (requires unzip command)
 */
async function extractZip(zipPath, outputDir) {
  const { exec } = require('child_process')
  return new Promise((resolve, reject) => {
    exec(`unzip -o "${zipPath}" -d "${outputDir}"`, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Parse OEWS CSV file and extract wage data
 */
function parseOEWSFile(filePath, areaCode, areaName) {
  console.log(`  📄 Parsing: ${path.basename(filePath)}`)
  
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  })
  
  const wageData = []
  
  for (const record of records) {
    // Filter for specific area if provided
    if (areaCode && record.area !== areaCode && record.area_code !== areaCode) {
      continue
    }
    
    const socCode = record.occ_code || record.OCC_CODE
    const medianWage = parseFloat(record.a_median || record.A_MEDIAN)
    const meanWage = parseFloat(record.a_mean || record.A_MEAN)
    const employment = parseInt(record.tot_emp || record.TOT_EMP)
    
    // Skip if no valid SOC code or wage data
    if (!socCode || socCode === '00-0000' || (!medianWage && !meanWage)) {
      continue
    }
    
    // Format SOC code (XX-XXXX)
    const formattedSOC = socCode.includes('-') ? socCode : 
      `${socCode.substring(0, 2)}-${socCode.substring(2)}`
    
    wageData.push({
      soc_code: formattedSOC,
      area_code: areaCode || record.area || record.area_code || '0000000',
      area_name: areaName || record.area_title || record.area_name || 'United States',
      median_wage: medianWage || null,
      mean_wage: meanWage || null,
      employment_level: employment || null,
      data_year: 2024,
      last_updated: new Date().toISOString(),
      expires_at: new Date('2025-05-01').toISOString() // Expires when May 2025 data is released
    })
  }
  
  console.log(`  ✅ Found ${wageData.length} occupations with wage data`)
  return wageData
}

/**
 * Import wage data to Supabase
 */
async function importToDatabase(wageData, areaName) {
  console.log(`\n💾 Importing ${wageData.length} records for ${areaName}...`)
  
  // Delete existing data for this area
  const areaCode = wageData[0]?.area_code
  if (areaCode) {
    const { error: deleteError } = await supabase
      .from('bls_wage_data')
      .delete()
      .eq('area_code', areaCode)
    
    if (deleteError) {
      console.error(`  ❌ Error deleting old data: ${deleteError.message}`)
    } else {
      console.log(`  🗑️  Cleared existing data for area ${areaCode}`)
    }
  }
  
  // Insert in batches of 100
  const batchSize = 100
  let imported = 0
  
  for (let i = 0; i < wageData.length; i += batchSize) {
    const batch = wageData.slice(i, i + batchSize)
    
    const { error } = await supabase
      .from('bls_wage_data')
      .insert(batch)
    
    if (error) {
      console.error(`  ❌ Error importing batch ${i / batchSize + 1}: ${error.message}`)
    } else {
      imported += batch.length
      process.stdout.write(`  📊 Imported: ${imported}/${wageData.length}\r`)
    }
  }
  
  console.log(`\n  ✅ Successfully imported ${imported} records`)
}

/**
 * Main import process
 */
async function main() {
  console.log('🚀 OEWS May 2024 Data Import\n')
  console.log('=' .repeat(60))
  
  // Create temp directory
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  
  try {
    // Import Tampa MSA Data
    console.log('\n📍 Tampa-St. Petersburg-Clearwater MSA')
    console.log('-'.repeat(60))
    
    const msaZip = path.join(DATA_DIR, 'oesm24ma.zip')
    console.log('  ⬇️  Downloading MSA data...')
    await downloadFile(DATA_URLS.msa, msaZip)
    
    console.log('  📦 Extracting...')
    await extractZip(msaZip, DATA_DIR)
    
    // Find the MSA data file (usually named like MSA_M2024_dl.xlsx or .csv)
    const msaFiles = fs.readdirSync(DATA_DIR).filter(f => 
      f.includes('MSA') && (f.endsWith('.csv') || f.endsWith('.xlsx'))
    )
    
    if (msaFiles.length > 0) {
      const msaFile = path.join(DATA_DIR, msaFiles[0])
      const tampaData = parseOEWSFile(msaFile, AREAS.tampa.code, AREAS.tampa.name)
      await importToDatabase(tampaData, AREAS.tampa.name)
    } else {
      console.log('  ⚠️  MSA data file not found')
    }
    
    // Import Florida State Data
    console.log('\n🏛️  Florida State')
    console.log('-'.repeat(60))
    
    const stateZip = path.join(DATA_DIR, 'oesm24st.zip')
    console.log('  ⬇️  Downloading state data...')
    await downloadFile(DATA_URLS.state, stateZip)
    
    console.log('  📦 Extracting...')
    await extractZip(stateZip, DATA_DIR)
    
    const stateFiles = fs.readdirSync(DATA_DIR).filter(f => 
      f.includes('state') && (f.endsWith('.csv') || f.endsWith('.xlsx'))
    )
    
    if (stateFiles.length > 0) {
      const stateFile = path.join(DATA_DIR, stateFiles[0])
      const floridaData = parseOEWSFile(stateFile, AREAS.florida.code, AREAS.florida.name)
      await importToDatabase(floridaData, AREAS.florida.name)
    } else {
      console.log('  ⚠️  State data file not found')
    }
    
    // Import National Data
    console.log('\n🇺🇸 National')
    console.log('-'.repeat(60))
    
    const nationalZip = path.join(DATA_DIR, 'oesm24nat.zip')
    console.log('  ⬇️  Downloading national data...')
    await downloadFile(DATA_URLS.national, nationalZip)
    
    console.log('  📦 Extracting...')
    await extractZip(nationalZip, DATA_DIR)
    
    const nationalFiles = fs.readdirSync(DATA_DIR).filter(f => 
      f.includes('national') && (f.endsWith('.csv') || f.endsWith('.xlsx'))
    )
    
    if (nationalFiles.length > 0) {
      const nationalFile = path.join(DATA_DIR, nationalFiles[0])
      const nationalData = parseOEWSFile(nationalFile, AREAS.national.code, AREAS.national.name)
      await importToDatabase(nationalData, AREAS.national.name)
    } else {
      console.log('  ⚠️  National data file not found')
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ OEWS May 2024 Import Complete!\n')
    console.log('Regional data priority is now active:')
    console.log('  1. Tampa-St. Petersburg-Clearwater MSA')
    console.log('  2. Florida State')
    console.log('  3. National\n')
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message)
    process.exit(1)
  }
}

// Run import
main().catch(console.error)
