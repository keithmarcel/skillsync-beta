const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createFeaturedRoles() {
  try {
    // Get companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(6)
    
    if (companiesError) {
      console.error('Error fetching companies:', companiesError)
      return
    }

    // Get some high-demand occupations to convert to featured roles
    const { data: occupations, error: occupationsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_kind', 'occupation')
      .in('category', ['Tech & Services', 'Business', 'Health & Education', 'Finance & Legal'])
      .limit(6)
    
    if (occupationsError) {
      console.error('Error fetching occupations:', occupationsError)
      return
    }

    console.log(`Found ${companies.length} companies and ${occupations.length} occupations`)

    // Create featured roles by pairing occupations with companies
    const featuredRoles = []
    for (let i = 0; i < Math.min(companies.length, occupations.length); i++) {
      const company = companies[i]
      const occupation = occupations[i]
      
      featuredRoles.push({
        job_kind: 'featured_role',
        title: occupation.title,
        soc_code: occupation.soc_code,
        company_id: company.id,
        job_type: 'Full-time',
        category: occupation.category,
        location_city: 'Tampa Bay',
        location_state: 'FL',
        median_wage_usd: occupation.median_wage_usd,
        long_desc: occupation.long_desc,
        skills_count: occupation.skills_count
      })
    }

    console.log(`Creating ${featuredRoles.length} featured roles...`)

    // Insert featured roles
    const { data, error } = await supabase
      .from('jobs')
      .insert(featuredRoles)
      .select()

    if (error) {
      console.error('Error inserting featured roles:', error)
    } else {
      console.log(`Successfully created ${data.length} featured roles`)
      data.forEach(role => {
        console.log(`- ${role.title} at company ID ${role.company_id}`)
      })
    }

  } catch (error) {
    console.error('Script error:', error)
  }
}

createFeaturedRoles()
