const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const csv = require('csv-parser')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// CSV column mapping (based on actual CSV structure)
const COLUMN_MAP = {
  recordId: 'Record ID',
  programName: 'Program Name',
  degreeTypeName: 'DegreeTypeName',
  discipline: 'Discipline',
  disciplineName: 'DisciplineName',
  programFormat: 'Program Format',
  programDuration: 'ProgramDuration',
  overview: 'Overview',
  university: 'University',
  universityNameSync: 'University Name Sync',
  admissionDetail: 'Admission Detail',
  benefits: 'Benefits',
  whatYoullLearn: "What You'll Learn",
  whoShouldRegister: 'Who should register',
  whyProgram: 'Why Program',
  curriculum: 'Curriculum',
  tuition: 'Tuition',
  tuitionCost: 'Tuition Cost',
  costPerCreditHour: 'Cost per Credit Hour',
  totalCreditHours: 'TotalCreditHours',
  programGuideUrl: 'Program Guide URL',
  heroImageUrl: 'HeroImageURL',
  programImage: 'Program Image',
  proficiencyLevel: 'Proficiency Level',
  careerPathway: 'Career Pathway',
  weeklyCommitment: 'WeeklyCommitment',
  nextStartDate: 'NextStartDate',
  isActive: 'IsActive',
  isAmplified: 'IsAmplified'
}

/**
 * Import CSV data into staging table
 */
async function importToStaging(csvPath) {
  console.log('📥 Starting CSV import to staging table...')
  
  const records = []
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns to staging table structure
        const record = {
          record_id: row[COLUMN_MAP.recordId],
          program_name: row[COLUMN_MAP.programName],
          degree_type_name: row[COLUMN_MAP.degreeTypeName],
          discipline: row[COLUMN_MAP.discipline],
          discipline_name: row[COLUMN_MAP.disciplineName],
          program_format: row[COLUMN_MAP.programFormat],
          program_duration: row[COLUMN_MAP.programDuration],
          overview: row[COLUMN_MAP.overview],
          university: row[COLUMN_MAP.university],
          university_name_sync: row[COLUMN_MAP.universityNameSync],
          admission_detail: row[COLUMN_MAP.admissionDetail],
          benefits: row[COLUMN_MAP.benefits],
          what_youll_learn: row[COLUMN_MAP.whatYoullLearn],
          who_should_register: row[COLUMN_MAP.whoShouldRegister],
          why_program: row[COLUMN_MAP.whyProgram],
          curriculum: row[COLUMN_MAP.curriculum],
          tuition: row[COLUMN_MAP.tuition],
          tuition_cost: row[COLUMN_MAP.tuitionCost],
          cost_per_credit_hour: row[COLUMN_MAP.costPerCreditHour],
          total_credit_hours: row[COLUMN_MAP.totalCreditHours],
          program_guide_url: row[COLUMN_MAP.programGuideUrl],
          hero_image_url: row[COLUMN_MAP.heroImageUrl],
          program_image: row[COLUMN_MAP.programImage],
          proficiency_level: row[COLUMN_MAP.proficiencyLevel],
          career_pathway: row[COLUMN_MAP.careerPathway],
          weekly_commitment: row[COLUMN_MAP.weeklyCommitment],
          next_start_date: row[COLUMN_MAP.nextStartDate],
          is_active: row[COLUMN_MAP.isActive],
          is_amplified: row[COLUMN_MAP.isAmplified],
          raw_data: row // Store complete row as JSON
        }
        
        // Only add records with valid record_id and program_name
        if (record.record_id && record.program_name) {
          records.push(record)
        }
      })
      .on('end', async () => {
        console.log(`📊 Parsed ${records.length} programs from CSV`)
        
        // Insert in batches of 50
        const batchSize = 50
        let imported = 0
        let skipped = 0
        
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize)
          
          const { data, error } = await supabase
            .from('hubspot_programs_staging')
            .upsert(batch, { onConflict: 'record_id' })
          
          if (error) {
            console.error(`❌ Error importing batch ${i / batchSize + 1}:`, error.message)
            skipped += batch.length
          } else {
            imported += batch.length
            console.log(`✓ Imported batch ${i / batchSize + 1} (${imported} total)`)
          }
        }
        
        console.log(`\n✅ Import complete: ${imported} imported, ${skipped} skipped`)
        resolve({ imported, skipped })
      })
      .on('error', reject)
  })
}

/**
 * Extract and create schools from staging data
 */
async function createSchools() {
  console.log('\n🏫 Creating schools from staging data...')
  
  // Get unique universities from staging
  const { data: stagingData, error: stagingError } = await supabase
    .from('hubspot_programs_staging')
    .select('university, university_name_sync')
  
  if (stagingError) {
    console.error('❌ Error fetching staging data:', stagingError)
    return
  }
  
  // Extract unique school names (prefer university_name_sync, fallback to university)
  const schoolNames = new Set()
  stagingData.forEach(row => {
    const schoolName = row.university_name_sync || row.university
    if (schoolName && schoolName.trim()) {
      schoolNames.add(schoolName.trim())
    }
  })
  
  console.log(`📋 Found ${schoolNames.size} unique schools`)
  
  // Check existing schools
  const { data: existingSchools } = await supabase
    .from('schools')
    .select('name')
  
  const existingNames = new Set(existingSchools?.map(s => s.name) || [])
  
  // Create new schools
  let created = 0
  for (const schoolName of schoolNames) {
    if (existingNames.has(schoolName)) {
      console.log(`✓ School already exists: ${schoolName}`)
      continue
    }
    
    const { error } = await supabase
      .from('schools')
      .insert({
        name: schoolName,
        city: null, // Will be populated later if needed
        state: 'FL' // Default to Florida for Bisk Amplified programs
      })
    
    if (error) {
      console.error(`❌ Error creating school ${schoolName}:`, error.message)
    } else {
      console.log(`✓ Created school: ${schoolName}`)
      created++
    }
  }
  
  console.log(`\n✅ Schools created: ${created}`)
}

/**
 * Main execution
 */
async function main() {
  const csvPath = process.argv[2] || 'docs/csv/hubspot-programs_2025-09-02-2.csv'
  
  console.log('🚀 HubSpot Programs Import Pipeline')
  console.log('=====================================\n')
  
  try {
    // Step 1: Import to staging
    await importToStaging(csvPath)
    
    // Step 2: Create schools
    await createSchools()
    
    console.log('\n✅ Import pipeline completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Run the data mapping script to process staging data')
    console.log('2. Review mapped programs in the programs table')
    console.log('3. Verify school associations are correct')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Import pipeline failed:', error)
    process.exit(1)
  }
}

main()
