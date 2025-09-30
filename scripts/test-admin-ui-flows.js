const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🧪 Testing Admin UI Flows')
console.log('==================================\n')

async function testProgramsList() {
  console.log('📋 Testing Programs List Page...')
  
  // Simulate the query used by /admin/programs page
  const { data: programs, error } = await supabase
    .from('programs')
    .select('*, school:schools(id, name)')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.log('❌ Programs list query failed:', error.message)
    return false
  }
  
  console.log(`✅ Programs list loaded: ${programs.length} programs`)
  
  // Verify all programs have required fields for table display
  const missingFields = programs.filter(p => 
    !p.name || !p.discipline || !p.catalog_provider || 
    p.is_featured === undefined || p.status === undefined
  )
  
  if (missingFields.length > 0) {
    console.log(`❌ ${missingFields.length} programs missing required fields`)
    return false
  }
  
  console.log('✅ All programs have required fields for display\n')
  return programs
}

async function testSearchFunctionality() {
  console.log('🔍 Testing Search Functionality...')
  
  // Test 1: Search by program name
  const { data: nameSearch, error: nameError } = await supabase
    .from('programs')
    .select('*')
    .ilike('name', '%Business%')
  
  if (nameError) {
    console.log('❌ Name search failed:', nameError.message)
    return false
  }
  
  console.log(`✅ Name search working: ${nameSearch.length} results for "Business"`)
  
  // Test 2: Search by discipline
  const { data: disciplineSearch, error: disciplineError } = await supabase
    .from('programs')
    .select('*')
    .eq('discipline', 'Technology')
  
  if (disciplineError) {
    console.log('❌ Discipline filter failed:', disciplineError.message)
    return false
  }
  
  console.log(`✅ Discipline filter working: ${disciplineSearch.length} Technology programs`)
  
  // Test 3: Search by catalog provider
  const { data: catalogSearch, error: catalogError } = await supabase
    .from('programs')
    .select('*')
    .eq('catalog_provider', 'Bisk Amplified')
  
  if (catalogError) {
    console.log('❌ Catalog filter failed:', catalogError.message)
    return false
  }
  
  console.log(`✅ Catalog filter working: ${catalogSearch.length} Bisk Amplified programs`)
  
  // Test 4: Combined search (name + discipline)
  const { data: combinedSearch, error: combinedError } = await supabase
    .from('programs')
    .select('*')
    .ilike('name', '%Management%')
    .eq('discipline', 'Business')
  
  if (combinedError) {
    console.log('❌ Combined search failed:', combinedError.message)
    return false
  }
  
  console.log(`✅ Combined search working: ${combinedSearch.length} results\n`)
  return true
}

async function testEditAction(programs) {
  console.log('✏️  Testing Edit Action...')
  
  if (!programs || programs.length === 0) {
    console.log('❌ No programs available for testing')
    return false
  }
  
  const testProgram = programs[0]
  
  // Simulate clicking Edit - fetch program details
  const { data: programDetail, error } = await supabase
    .from('programs')
    .select('*, school:schools(*)')
    .eq('id', testProgram.id)
    .single()
  
  if (error) {
    console.log('❌ Edit action failed - cannot fetch program:', error.message)
    return false
  }
  
  console.log(`✅ Edit action working - loaded: "${programDetail.name}"`)
  
  // Verify all fields needed for edit form are present
  const requiredFields = [
    'name', 'school_id', 'discipline', 'catalog_provider', 
    'program_type', 'format', 'duration_text', 'cip_code',
    'short_desc', 'long_desc', 'program_url', 'program_guide_url',
    'is_featured', 'featured_image_url', 'skills_count',
    'program_id', 'created_at', 'updated_at'
  ]
  
  const missingFields = requiredFields.filter(field => !(field in programDetail))
  
  if (missingFields.length > 0) {
    console.log('❌ Missing fields for edit form:', missingFields.join(', '))
    return false
  }
  
  console.log('✅ All fields available for edit form')
  
  // Verify school data is loaded
  if (!programDetail.school) {
    console.log('❌ School data not loaded for edit form')
    return false
  }
  
  console.log(`✅ School data loaded: "${programDetail.school.name}"\n`)
  return programDetail
}

async function testViewProviderAction(programDetail) {
  console.log('🏫 Testing View Provider Action...')
  
  if (!programDetail || !programDetail.school_id) {
    console.log('❌ No program or school_id available')
    return false
  }
  
  // Simulate clicking View Provider - fetch school details
  const { data: school, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', programDetail.school_id)
    .single()
  
  if (error) {
    console.log('❌ View Provider action failed:', error.message)
    return false
  }
  
  console.log(`✅ View Provider action working - loaded: "${school.name}"`)
  
  // Verify school has required fields
  const requiredFields = ['id', 'name', 'logo_url', 'about_url', 'city', 'state', 'catalog_affiliation']
  const missingFields = requiredFields.filter(field => !(field in school))
  
  if (missingFields.length > 0) {
    console.log('❌ Missing fields for provider view:', missingFields.join(', '))
    return false
  }
  
  console.log('✅ All fields available for provider view\n')
  return true
}

async function testToggleActions(programs) {
  console.log('🔄 Testing Toggle Actions...')
  
  if (!programs || programs.length === 0) {
    console.log('❌ No programs available for testing')
    return false
  }
  
  const testProgram = programs[0]
  const originalFeaturedState = testProgram.is_featured
  const originalStatus = testProgram.status
  
  // Test 1: Toggle featured status
  const { data: toggledFeatured, error: featuredError } = await supabase
    .from('programs')
    .update({ is_featured: !originalFeaturedState })
    .eq('id', testProgram.id)
    .select()
    .single()
  
  if (featuredError) {
    console.log('❌ Featured toggle failed:', featuredError.message)
    return false
  }
  
  console.log(`✅ Featured toggle working: ${originalFeaturedState} → ${toggledFeatured.is_featured}`)
  
  // Restore original state
  await supabase
    .from('programs')
    .update({ is_featured: originalFeaturedState })
    .eq('id', testProgram.id)
  
  // Test 2: Toggle published status
  const newStatus = originalStatus === 'published' ? 'draft' : 'published'
  const { data: toggledStatus, error: statusError } = await supabase
    .from('programs')
    .update({ status: newStatus })
    .eq('id', testProgram.id)
    .select()
    .single()
  
  if (statusError) {
    console.log('❌ Status toggle failed:', statusError.message)
    return false
  }
  
  console.log(`✅ Status toggle working: ${originalStatus} → ${toggledStatus.status}`)
  
  // Restore original state
  await supabase
    .from('programs')
    .update({ status: originalStatus })
    .eq('id', testProgram.id)
  
  console.log('✅ Both toggles restored to original state\n')
  return true
}

async function testUpdateProgram(programDetail) {
  console.log('💾 Testing Program Update...')
  
  if (!programDetail) {
    console.log('❌ No program available for testing')
    return false
  }
  
  const originalDesc = programDetail.short_desc
  const testDesc = 'TEST DESCRIPTION - Admin Tools Validation'
  
  // Update the program
  const { data: updated, error: updateError } = await supabase
    .from('programs')
    .update({ short_desc: testDesc })
    .eq('id', programDetail.id)
    .select()
    .single()
  
  if (updateError) {
    console.log('❌ Program update failed:', updateError.message)
    return false
  }
  
  console.log('✅ Program update working - description changed')
  
  // Verify updated_at changed
  if (updated.updated_at === programDetail.updated_at) {
    console.log('⚠️  Warning: updated_at timestamp did not change')
  } else {
    console.log('✅ updated_at trigger working - timestamp updated')
  }
  
  // Restore original description
  await supabase
    .from('programs')
    .update({ short_desc: originalDesc })
    .eq('id', programDetail.id)
  
  console.log('✅ Program restored to original state\n')
  return true
}

async function testDeleteAction() {
  console.log('🗑️  Testing Delete Action...')
  
  // Create a test program to delete
  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .limit(1)
    .single()
  
  const testProgram = {
    name: 'DELETE TEST - Admin Tools',
    program_id: '3deletetest',
    school_id: school.id,
    program_type: 'Certificate',
    discipline: 'Technology',
    catalog_provider: 'Direct',
    status: 'draft'
  }
  
  // Create test program
  const { data: created, error: createError } = await supabase
    .from('programs')
    .insert(testProgram)
    .select()
    .single()
  
  if (createError) {
    console.log('❌ Cannot create test program:', createError.message)
    return false
  }
  
  console.log(`✅ Test program created: "${created.name}"`)
  
  // Delete the test program
  const { error: deleteError } = await supabase
    .from('programs')
    .delete()
    .eq('id', created.id)
  
  if (deleteError) {
    console.log('❌ Delete action failed:', deleteError.message)
    return false
  }
  
  console.log('✅ Delete action working - test program removed')
  
  // Verify deletion
  const { data: deleted } = await supabase
    .from('programs')
    .select('id')
    .eq('id', created.id)
    .single()
  
  if (deleted) {
    console.log('❌ Program still exists after delete')
    return false
  }
  
  console.log('✅ Deletion verified - program no longer exists\n')
  return true
}

async function runUIFlowTests() {
  try {
    console.log('Starting comprehensive UI flow tests...\n')
    
    // Test 1: Programs List
    const programs = await testProgramsList()
    if (!programs) {
      console.log('❌ Programs list test failed - stopping')
      process.exit(1)
    }
    
    // Test 2: Search
    const searchWorking = await testSearchFunctionality()
    if (!searchWorking) {
      console.log('❌ Search test failed - stopping')
      process.exit(1)
    }
    
    // Test 3: Edit Action
    const programDetail = await testEditAction(programs)
    if (!programDetail) {
      console.log('❌ Edit action test failed - stopping')
      process.exit(1)
    }
    
    // Test 4: View Provider Action
    const providerWorking = await testViewProviderAction(programDetail)
    if (!providerWorking) {
      console.log('❌ View Provider test failed - stopping')
      process.exit(1)
    }
    
    // Test 5: Toggle Actions
    const togglesWorking = await testToggleActions(programs)
    if (!togglesWorking) {
      console.log('❌ Toggle actions test failed - stopping')
      process.exit(1)
    }
    
    // Test 6: Update Program
    const updateWorking = await testUpdateProgram(programDetail)
    if (!updateWorking) {
      console.log('❌ Update test failed - stopping')
      process.exit(1)
    }
    
    // Test 7: Delete Action
    const deleteWorking = await testDeleteAction()
    if (!deleteWorking) {
      console.log('❌ Delete action test failed - stopping')
      process.exit(1)
    }
    
    console.log('==================================')
    console.log('🎉 All UI Flow Tests Passed!')
    console.log('==================================\n')
    console.log('✅ Programs List - Working')
    console.log('✅ Search (name, discipline, catalog) - Working')
    console.log('✅ Edit Action - Working')
    console.log('✅ View Provider Action - Working')
    console.log('✅ Featured Toggle - Working')
    console.log('✅ Published Toggle - Working')
    console.log('✅ Update Program - Working')
    console.log('✅ Delete Action - Working')
    console.log('\n🚀 Admin tools fully functional end-to-end!')
    
    process.exit(0)
  } catch (error) {
    console.log('❌ Test Error:', error.message)
    process.exit(1)
  }
}

runUIFlowTests()
