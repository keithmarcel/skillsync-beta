const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Parse CSV data
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    return obj
  })
}

async function importFeaturedRoles() {
  try {
    console.log('Reading featured roles seed data...')
    const csvPath = path.join(__dirname, '../docs/documentation/featured_roles_seed.csv')
    const csvData = fs.readFileSync(csvPath, 'utf8')
    const roles = parseCSV(csvData)
    
    console.log(`Parsed ${roles.length} featured roles`)
    
    // Get company mappings
    const companyMap = {
      'Power Design': 'Power Design',
      'TD SYNNEX': 'TD SYNNEX', 
      'BayCare': 'BayCare',
      'TECO': 'TECO',
      'Raymond James': 'Raymond James',
      'Spectrum': 'Spectrum'
    }
    
    // Get company IDs from database
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
    
    if (companyError) {
      console.error('Error fetching companies:', companyError)
      process.exit(1)
    }
    
    const companyIdMap = {}
    companies.forEach(company => {
      companyIdMap[company.name] = company.id
    })
    
    // Transform data for database
    const featuredRoles = roles.map((role, index) => {
      const companyId = companyIdMap[role.employer]
      if (!companyId) {
        console.warn(`Warning: Company "${role.employer}" not found in database`)
      }
      
      return {
        job_kind: 'featured_role',
        title: role.role_title,
        soc_code: role.soc_code,
        company_id: companyId,
        job_type: role.employment_type,
        category: 'Featured Role',
        location_city: role.region.split(',')[0]?.trim(),
        location_state: role.region.split(',')[1]?.trim(),
        skills_count: parseInt(role.skills_count) || 0,
        long_desc: role.notes || `${role.role_title} position at ${role.employer}`,
        featured_image_url: '/assets/hero_featured-roles.jpg',
        is_featured: true
      }
    })
    
    console.log('Inserting featured roles into database...')
    
    // Insert into jobs table
    const { data, error } = await supabase
      .from('jobs')
      .insert(featuredRoles)
    
    if (error) {
      console.error('Error inserting featured roles:', error)
      process.exit(1)
    }
    
    console.log(`Successfully imported ${featuredRoles.length} featured roles`)
    console.log('Featured roles data:')
    featuredRoles.forEach(role => {
      console.log(`- ${role.title} at ${role.company_id ? 'Company ID: ' + role.company_id : 'No Company'} (${role.skills_count} skills)`)
    })
    
  } catch (error) {
    console.error('Error importing featured roles:', error)
    process.exit(1)
  }
}

importFeaturedRoles()
