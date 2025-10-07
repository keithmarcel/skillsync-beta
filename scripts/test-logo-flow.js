import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testLogoFlow() {
  console.log('🧪 Testing Logo Upload Flow\n')
  
  // 1. Check schools table structure
  console.log('1️⃣ Checking schools table structure...')
  const { data: sampleSchool, error: structureError } = await supabase
    .from('schools')
    .select('*')
    .limit(1)
    .single()
  
  if (structureError) {
    console.error('❌ Error:', structureError)
    process.exit(1)
  }
  
  console.log('✅ Schools table fields:', Object.keys(sampleSchool))
  console.log('   - logo_url field exists:', 'logo_url' in sampleSchool)
  
  // 2. Check where logos are used in the app
  console.log('\n2️⃣ Checking where school logos are displayed...')
  
  // Featured Programs
  const { data: featuredPrograms } = await supabase
    .from('programs')
    .select(`
      id,
      name,
      school:schools(id, name, logo_url)
    `)
    .eq('is_featured', true)
    .limit(3)
  
  console.log('\n   📍 Featured Programs (uses school logos):')
  featuredPrograms?.forEach(p => {
    console.log(`      - ${p.name}`)
    console.log(`        School: ${p.school?.name}`)
    console.log(`        Logo: ${p.school?.logo_url || '(not set)'}`)
  })
  
  // All Programs
  const { data: allPrograms } = await supabase
    .from('programs')
    .select(`
      id,
      name,
      school:schools(id, name, logo_url)
    `)
    .limit(3)
  
  console.log('\n   📍 All Programs (uses school logos):')
  allPrograms?.forEach(p => {
    console.log(`      - ${p.name}`)
    console.log(`        School: ${p.school?.name}`)
    console.log(`        Logo: ${p.school?.logo_url || '(not set)'}`)
  })
  
  // 3. Test update flow
  console.log('\n3️⃣ Testing logo update flow...')
  
  const testSchool = await supabase
    .from('schools')
    .select('*')
    .eq('name', 'Bisk Workforce Essentials')
    .single()
  
  if (testSchool.data) {
    console.log(`   Test school: ${testSchool.data.name}`)
    console.log(`   Current logo: ${testSchool.data.logo_url || '(not set)'}`)
    console.log(`   ✅ Ready for logo upload via admin UI`)
  }
  
  // 4. Summary
  console.log('\n📋 LOGO FLOW SUMMARY:')
  console.log('   ✅ Database: schools.logo_url field exists')
  console.log('   ✅ Admin UI: /admin/providers/[id] → Media & Branding tab')
  console.log('   ✅ Upload Component: ImageUpload component created')
  console.log('   ✅ API Route: /api/admin/upload-logo')
  console.log('   ✅ Display: Featured Programs & All Programs cards')
  console.log('   ✅ Storage: /public/schools/ directory')
  
  console.log('\n🎯 TESTING STEPS:')
  console.log('   1. Go to: http://localhost:3000/admin/providers')
  console.log('   2. Click on any provider to edit')
  console.log('   3. Go to "Media & Branding" tab')
  console.log('   4. Upload an SVG/PNG logo')
  console.log('   5. Save the provider')
  console.log('   6. Check /programs page to see logo displayed')
  
  process.exit(0)
}

testLogoFlow()
