const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const companies = [
  {
    name: 'Power Design',
    is_trusted_partner: true,
    hq_city: 'St. Petersburg',
    hq_state: 'FL',
    industry: 'Engineering & Construction',
    bio: 'Leading electrical and technology systems contractor serving commercial and industrial clients.'
  },
  {
    name: 'TD SYNNEX',
    is_trusted_partner: true,
    hq_city: 'Clearwater',
    hq_state: 'FL',
    industry: 'Technology Distribution',
    bio: 'Global distributor and solutions aggregator for the IT ecosystem.'
  },
  {
    name: 'BayCare',
    is_trusted_partner: true,
    hq_city: 'Clearwater',
    hq_state: 'FL',
    industry: 'Healthcare',
    bio: 'Leading not-for-profit health care system serving the Tampa Bay and central Florida regions.'
  },
  {
    name: 'TECO',
    is_trusted_partner: false,
    hq_city: 'Tampa',
    hq_state: 'FL',
    industry: 'Energy & Utilities',
    bio: 'Tampa Electric Company providing reliable electricity to West Central Florida.'
  },
  {
    name: 'Raymond James',
    is_trusted_partner: true,
    hq_city: 'St. Petersburg',
    hq_state: 'FL',
    industry: 'Financial Services',
    bio: 'Leading diversified financial services company providing investment management and financial planning.'
  },
  {
    name: 'Spectrum',
    is_trusted_partner: false,
    hq_city: 'Tampa',
    hq_state: 'FL',
    industry: 'Telecommunications',
    bio: 'Leading broadband connectivity company and cable operator serving residential and business customers.'
  }
]

async function createCompanies() {
  try {
    console.log('Creating companies...')
    
    const { data, error } = await supabase
      .from('companies')
      .insert(companies)
      .select()
    
    if (error) {
      console.error('Error creating companies:', error)
      process.exit(1)
    }
    
    console.log(`Successfully created ${data.length} companies`)
    
    // Now update jobs with company associations
    const jobCompanyMappings = [
      { jobTitle: 'Mechanical Assistant Project Manager', companyName: 'Power Design' },
      { jobTitle: 'Senior Financial Analyst (FP&A)', companyName: 'TD SYNNEX' },
      { jobTitle: 'Mechanical Project Manager', companyName: 'Power Design' },
      { jobTitle: 'Surgical Technologist (Certified)', companyName: 'BayCare' },
      { jobTitle: 'Business Development Manager', companyName: 'TECO' },
      { jobTitle: 'Administrative Assistant', companyName: 'Raymond James' },
      { jobTitle: 'Supervisor, Residential Inbound Sales', companyName: 'Spectrum' },
      { jobTitle: 'Senior Mechanical Project Manager', companyName: 'Power Design' }
    ]
    
    for (const mapping of jobCompanyMappings) {
      const company = data.find(c => c.name === mapping.companyName)
      if (company) {
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ company_id: company.id })
          .eq('title', mapping.jobTitle)
          .eq('category', 'Featured Role')
        
        if (updateError) {
          console.error(`Error updating job ${mapping.jobTitle}:`, updateError)
        } else {
          console.log(`Updated ${mapping.jobTitle} with ${mapping.companyName}`)
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

createCompanies()
