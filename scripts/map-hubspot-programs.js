const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * AI-powered text summarization
 * Condenses overview text to ~80-100 characters matching existing pattern
 */
function summarizeOverview(overview) {
  if (!overview) return null
  
  // Remove HTML tags
  const cleanText = overview.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  
  // If already short enough, return as-is
  if (cleanText.length <= 100) return cleanText
  
  // Extract first sentence or meaningful phrase
  const sentences = cleanText.split(/[.!?]+/)
  const firstSentence = sentences[0]?.trim()
  
  if (firstSentence && firstSentence.length <= 100) {
    return firstSentence + '.'
  }
  
  // Truncate intelligently at word boundary
  const truncated = cleanText.substring(0, 97)
  const lastSpace = truncated.lastIndexOf(' ')
  
  return truncated.substring(0, lastSpace) + '...'
}

/**
 * Normalize program type from degree type name
 */
function normalizeProgramType(degreeTypeName) {
  if (!degreeTypeName) return 'Certificate'
  
  const lower = degreeTypeName.toLowerCase()
  
  if (lower.includes('bachelor')) return "Bachelor's Degree"
  if (lower.includes('master')) return "Master's Degree"
  if (lower.includes('associate')) return "Associate's Degree"
  if (lower.includes('certificate')) return 'Certificate'
  if (lower.includes('diploma')) return 'Diploma'
  if (lower.includes('doctoral') || lower.includes('phd')) return 'Doctoral Degree'
  
  return 'Certificate' // Default
}

/**
 * Normalize discipline
 */
function normalizeDiscipline(discipline) {
  if (!discipline) return 'General Studies'
  
  const disciplineMap = {
    'business': 'Business',
    'technology': 'Technology',
    'healthcare': 'Healthcare',
    'education': 'Education',
    'engineering': 'Engineering',
    'arts': 'Arts & Humanities',
    'science': 'Science',
    'social': 'Social Sciences',
    'criminal': 'Criminal Justice',
    'nursing': 'Healthcare'
  }
  
  const lower = discipline.toLowerCase()
  for (const [key, value] of Object.entries(disciplineMap)) {
    if (lower.includes(key)) return value
  }
  
  return discipline // Return original if no match
}

/**
 * Map staging data to programs table
 */
async function mapStagingToPrograms() {
  console.log('🔄 Mapping staging data to programs table...')
  
  // Get unprocessed staging records
  const { data: stagingRecords, error: stagingError } = await supabase
    .from('hubspot_programs_staging')
    .select('*')
    .eq('processed', false)
  
  if (stagingError) {
    console.error('❌ Error fetching staging records:', stagingError)
    return
  }
  
  console.log(`📊 Found ${stagingRecords.length} unprocessed records`)
  
  // Get schools for mapping
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
  
  const schoolMap = {}
  schools?.forEach(school => {
    schoolMap[school.name] = school.id
  })
  
  let mapped = 0
  let skipped = 0
  
  for (const record of stagingRecords) {
    try {
      // Find school ID
      const schoolName = record.university_name_sync || record.university
      const schoolId = schoolMap[schoolName?.trim()]
      
      if (!schoolId) {
        console.warn(`⚠️  No school found for: ${schoolName}`)
        skipped++
        continue
      }
      
      // Generate program URL
      const programUrl = `https://app.biskamplified.com/amp-programs-overview/${record.record_id}?portal=explore&partner=amp`
      
      // Prepare program data
      const programData = {
        program_id: record.record_id,
        name: record.program_name,
        school_id: schoolId,
        program_type: normalizeProgramType(record.degree_type_name),
        format: record.program_format || 'Online',
        duration_text: record.program_duration,
        short_desc: summarizeOverview(record.overview),
        long_desc: record.overview,
        discipline: normalizeDiscipline(record.discipline),
        catalog_provider: 'Bisk Amplified',
        program_url: programUrl,
        program_guide_url: record.program_guide_url,
        status: 'published'
      }
      
      // Insert or update program
      const { data: insertedProgram, error: insertError } = await supabase
        .from('programs')
        .upsert(programData, { onConflict: 'program_id' })
        .select()
        .single()
      
      if (insertError) {
        console.error(`❌ Error mapping program ${record.program_name}:`, insertError.message)
        
        // Update staging with error
        await supabase
          .from('hubspot_programs_staging')
          .update({
            processing_notes: insertError.message
          })
          .eq('id', record.id)
        
        skipped++
        continue
      }
      
      // Mark staging record as processed
      await supabase
        .from('hubspot_programs_staging')
        .update({
          processed: true,
          mapped_to_program_id: insertedProgram.id,
          processing_notes: 'Successfully mapped'
        })
        .eq('id', record.id)
      
      console.log(`✓ Mapped: ${record.program_name}`)
      mapped++
      
    } catch (error) {
      console.error(`❌ Error processing record ${record.record_id}:`, error.message)
      skipped++
    }
  }
  
  console.log(`\n✅ Mapping complete: ${mapped} mapped, ${skipped} skipped`)
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 HubSpot Programs Mapping Pipeline')
  console.log('======================================\n')
  
  try {
    await mapStagingToPrograms()
    
    console.log('\n✅ Mapping pipeline completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Review programs table for new entries')
    console.log('2. Verify short descriptions are appropriate')
    console.log('3. Check school associations')
    console.log('4. Update any missing disciplines or program types')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Mapping pipeline failed:', error)
    process.exit(1)
  }
}

main()
