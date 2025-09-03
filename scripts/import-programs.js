const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// School data mapping (matching actual schema: id, name, logo_url, about_url, city, state)
const schoolsData = [
  {
    name: 'St. Petersburg College',
    logo_url: '/schools/spc.svg',
    about_url: 'https://www.spcollege.edu',
    city: 'St. Petersburg',
    state: 'FL'
  },
  {
    name: 'University of South Florida',
    logo_url: '/schools/USF.svg',
    about_url: 'https://www.usf.edu',
    city: 'Tampa',
    state: 'FL'
  },
  {
    name: 'Pinellas Technical College',
    logo_url: '/schools/ptec.png',
    about_url: 'https://www.myptec.org',
    city: 'St. Petersburg',
    state: 'FL'
  }
]

// Program data from CSV
const programsData = [
  {
    name: 'Project Management Certificate',
    institution: 'St. Petersburg College',
    credential_type: 'Certificate',
    modality: 'Online',
    duration: '12 Weeks',
    summary: 'Case‑study–driven program covering planning, execution, Agile tools, and team leadership.',
    jobs_matched_count: 8
  },
  {
    name: 'Business Administration A.S.',
    institution: 'University of South Florida',
    credential_type: "Associate's",
    modality: 'Online',
    duration: '2 Years',
    summary: 'Builds broad business skills in communication, decision‑making, and other core areas.',
    jobs_matched_count: 11
  },
  {
    name: 'Construction Management A.S.',
    institution: 'St. Petersburg College',
    credential_type: "Associate's",
    modality: 'Hybrid',
    duration: '2 Years',
    summary: 'Practical business, design, and construction coursework preparing for roles in construction.',
    jobs_matched_count: 3
  },
  {
    name: 'Certificate of Professional Preparation',
    institution: 'University of South Florida',
    credential_type: 'Certificate',
    modality: 'Online',
    duration: '6 Months',
    summary: 'End‑to‑end PM coverage (scope, schedule, budget, quality, risk, procurement, HR/teams).',
    jobs_matched_count: 6
  },
  {
    name: 'Project Management Certificate',
    institution: 'Pinellas Technical College',
    credential_type: 'Certificate',
    modality: 'Online',
    duration: '3 Months',
    summary: 'Uses real‑world projects; meets PMI 35‑hour education requirement and prepares for PMP.',
    jobs_matched_count: 17
  }
]

async function importSchools() {
  console.log('Importing schools...')
  
  for (const school of schoolsData) {
    // Check if school already exists
    const { data: existing } = await supabase
      .from('schools')
      .select('id')
      .eq('name', school.name)
      .single()
    
    if (existing) {
      console.log(`✓ School already exists: ${school.name}`)
      continue
    }
    
    const { data, error } = await supabase
      .from('schools')
      .insert(school)
      .select()
    
    if (error) {
      console.error(`Error importing school ${school.name}:`, error)
    } else {
      console.log(`✓ Imported school: ${school.name}`)
    }
  }
}

async function importPrograms() {
  console.log('Importing programs...')
  
  // Get schools for mapping
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('id, name')
  
  if (schoolsError) {
    console.error('Error fetching schools:', schoolsError)
    return
  }
  
  const schoolMap = {}
  schools.forEach(school => {
    schoolMap[school.name] = school.id
  })
  
  for (const program of programsData) {
    const schoolId = schoolMap[program.institution]
    if (!schoolId) {
      console.error(`School not found: ${program.institution}`)
      continue
    }
    
    const programData = {
      name: program.name,
      short_desc: program.summary,
      program_type: program.credential_type,
      format: program.modality,
      duration_text: program.duration,
      school_id: schoolId,
      program_url: '#'
    }
    
    // Check if program already exists
    const { data: existing } = await supabase
      .from('programs')
      .select('id')
      .eq('name', program.name)
      .eq('school_id', schoolId)
      .single()
    
    if (existing) {
      console.log(`✓ Program already exists: ${program.name}`)
      continue
    }
    
    const { data, error } = await supabase
      .from('programs')
      .insert(programData)
      .select()
    
    if (error) {
      console.error(`Error importing program ${program.name}:`, error)
    } else {
      console.log(`✓ Imported program: ${program.name}`)
    }
  }
}

async function main() {
  try {
    await importSchools()
    await importPrograms()
    console.log('✅ Import completed successfully!')
  } catch (error) {
    console.error('❌ Import failed:', error)
  }
}

main()
