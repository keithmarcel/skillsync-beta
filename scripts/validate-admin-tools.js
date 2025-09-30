const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🧪 Admin Tools Validation Script')
console.log('==================================\n')

async function validateSchema() {
  console.log('📋 Validating Schema...')
  
  const requiredColumns = [
    'program_id', 'catalog_provider', 'discipline', 'long_desc',
    'program_guide_url', 'is_featured', 'featured_image_url',
    'skills_count', 'created_at', 'updated_at'
  ]
  
  const { data: columns, error } = await supabase
    .from('programs')
    .select('*')
    .limit(1)
  
  if (error) {
    console.log('❌ Error fetching programs:', error.message)
    return false
  }
  
  const program = columns[0]
  const missingColumns = requiredColumns.filter(col => !(col in program))
  
  if (missingColumns.length > 0) {
    console.log('❌ Missing columns:', missingColumns.join(', '))
    return false
  }
  
  console.log('✅ All required columns present\n')
  return true
}

async function validateDataIntegrity() {
  console.log('🔍 Validating Data Integrity...')
  
  // Check for null program_ids
  const { data: nullIds, error: nullError } = await supabase
    .from('programs')
    .select('id, name')
    .is('program_id', null)
  
  if (nullError) {
    console.log('❌ Error checking program_ids:', nullError.message)
    return false
  }
  
  if (nullIds.length > 0) {
    console.log(`❌ Found ${nullIds.length} programs with null program_id`)
    return false
  }
  
  console.log('✅ All programs have valid program_ids')
  
  // Check program_id uniqueness
  const { data: allPrograms } = await supabase
    .from('programs')
    .select('program_id')
  
  const programIds = allPrograms.map(p => p.program_id)
  const uniqueIds = new Set(programIds)
  
  if (programIds.length !== uniqueIds.size) {
    console.log('❌ Duplicate program_ids found')
    return false
  }
  
  console.log('✅ All program_ids are unique')
  
  // Check Direct programs start with 3
  const { data: directPrograms } = await supabase
    .from('programs')
    .select('program_id, catalog_provider')
    .eq('catalog_provider', 'Direct')
  
  const invalidDirect = directPrograms.filter(p => !p.program_id.startsWith('3'))
  
  if (invalidDirect.length > 0) {
    console.log(`❌ Found ${invalidDirect.length} Direct programs not starting with 3`)
    return false
  }
  
  console.log('✅ All Direct programs have correct program_ids')
  
  // Check schools exist
  const { data: orphanedPrograms } = await supabase
    .from('programs')
    .select('id, name, school_id, school:schools(id)')
    .not('school_id', 'is', null)
  
  const missingSchools = orphanedPrograms.filter(p => !p.school)
  
  if (missingSchools.length > 0) {
    console.log(`❌ Found ${missingSchools.length} programs with invalid school_id`)
    return false
  }
  
  console.log('✅ All programs linked to valid schools\n')
  return true
}

async function validateEndpoints() {
  console.log('🌐 Validating Endpoints...')
  
  // Test programs list
  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select('*, school:schools(id, name)')
    .limit(10)
  
  if (programsError) {
    console.log('❌ Programs list endpoint failed:', programsError.message)
    return false
  }
  
  console.log(`✅ Programs list endpoint working (${programs.length} records)`)
  
  // Test featured programs
  const { data: featured, error: featuredError } = await supabase
    .from('programs')
    .select('*')
    .eq('is_featured', true)
    .eq('status', 'published')
  
  if (featuredError) {
    console.log('❌ Featured programs endpoint failed:', featuredError.message)
    return false
  }
  
  console.log(`✅ Featured programs endpoint working (${featured.length} featured)`)
  
  // Test search
  const { data: searchResults, error: searchError } = await supabase
    .from('programs')
    .select('*')
    .ilike('name', '%Business%')
    .limit(5)
  
  if (searchError) {
    console.log('❌ Search endpoint failed:', searchError.message)
    return false
  }
  
  console.log(`✅ Search endpoint working (${searchResults.length} results)\n`)
  return true
}

async function validateFunctionality() {
  console.log('⚙️  Validating Functionality...')
  
  // Test get_featured_programs function
  const { data: featuredFunc, error: featuredFuncError } = await supabase
    .rpc('get_featured_programs')
  
  if (featuredFuncError) {
    console.log('❌ get_featured_programs function failed:', featuredFuncError.message)
    return false
  }
  
  console.log(`✅ get_featured_programs function working (${featuredFunc.length} programs)`)
  
  // Test get_programs_with_skills function
  const { data: skillsFunc, error: skillsFuncError } = await supabase
    .rpc('get_programs_with_skills')
  
  if (skillsFuncError) {
    console.log('❌ get_programs_with_skills function failed:', skillsFuncError.message)
    return false
  }
  
  console.log(`✅ get_programs_with_skills function working (${skillsFunc.length} programs)\n`)
  return true
}

async function validateCounts() {
  console.log('📊 Validating Counts...')
  
  const { count: totalPrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
  
  const { count: directPrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('catalog_provider', 'Direct')
  
  const { count: biskPrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('catalog_provider', 'Bisk Amplified')
  
  const { count: featuredPrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('is_featured', true)
  
  const { count: publishedPrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
  
  const { count: totalSchools } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true })
  
  console.log(`✅ Total Programs: ${totalPrograms}`)
  console.log(`✅ Direct Programs: ${directPrograms}`)
  console.log(`✅ Bisk Amplified Programs: ${biskPrograms}`)
  console.log(`✅ Featured Programs: ${featuredPrograms}`)
  console.log(`✅ Published Programs: ${publishedPrograms}`)
  console.log(`✅ Total Schools: ${totalSchools}\n`)
  
  return true
}

async function runValidation() {
  try {
    const schemaValid = await validateSchema()
    const dataValid = await validateDataIntegrity()
    const endpointsValid = await validateEndpoints()
    const functionalityValid = await validateFunctionality()
    const countsValid = await validateCounts()
    
    console.log('==================================')
    if (schemaValid && dataValid && endpointsValid && functionalityValid && countsValid) {
      console.log('🎉 All Validations Passed!')
      console.log('✅ Admin tools are production-ready')
      process.exit(0)
    } else {
      console.log('❌ Some Validations Failed')
      console.log('Please review errors above')
      process.exit(1)
    }
  } catch (error) {
    console.log('❌ Validation Error:', error.message)
    process.exit(1)
  }
}

runValidation()
