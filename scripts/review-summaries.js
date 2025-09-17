const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Consolidated one-sentence summaries for high demand occupations
const consolidatedSummaries = {
  'Registered Nurses': 'Provide and coordinate patient care, educate patients about health conditions, and provide advice and emotional support to patients and their families.',
  'Software Developers': 'Design, develop, and maintain software applications and systems using programming languages and development tools.',
  'General and Operations Managers': 'Plan, direct, and coordinate the operations of organizations to ensure efficient and effective business performance.',
  'Customer Service Representatives': 'Interact with customers to provide information, resolve complaints, and process orders or transactions.',
  'Sales Representatives': 'Sell products or services to businesses and consumers, build client relationships, and meet sales targets.',
  'Food Service Workers': 'Prepare and serve food, maintain cleanliness standards, and provide customer service in restaurants and food establishments.',
  'Retail Salespersons': 'Assist customers in retail stores by providing product information, processing sales transactions, and maintaining merchandise displays.',
  'Accountants and Auditors': 'Examine financial records, prepare tax returns, and ensure compliance with financial regulations and standards.',
  'Marketing Specialists': 'Research market conditions, develop marketing strategies, and promote products or services to target audiences.',
  'Administrative Assistants': 'Provide clerical and administrative support including scheduling, correspondence, and office management tasks.',
  'Teachers': 'Educate students in various subjects, develop lesson plans, and assess student progress and learning outcomes.',
  'Maintenance and Repair Workers': 'Perform routine maintenance and repairs on buildings, equipment, and machinery to ensure proper operation.',
  'Security Guards': 'Monitor and patrol premises to prevent theft, violence, and infractions of rules while maintaining safety and security.',
  'Truck Drivers': 'Transport goods and materials over short and long distances using commercial vehicles while ensuring safe delivery.',
  'Construction Workers': 'Build, repair, and maintain structures including residential, commercial, and infrastructure projects.',
  'Medical Assistants': 'Support healthcare providers by performing clinical and administrative tasks in medical offices and clinics.',
  'Real Estate Sales Agents': 'Help clients buy, sell, and rent properties by providing market expertise and facilitating real estate transactions.',
  'First-Line Supervisors of Construction Trades & Extraction Workers': 'Supervise and coordinate construction workers and projects while ensuring safety standards and quality control.',
  'Carpenters': 'Construct, install, and repair structures and fixtures made of wood and other materials in residential and commercial settings.',
  'Computer User Support Specialists': 'Provide technical assistance and support to computer users, troubleshoot hardware and software issues.',
  'Claims Adjusters, Examiners, & Investigators': 'Review insurance claims, investigate circumstances, and determine coverage and settlement amounts.',
  'Electricians': 'Install, maintain, and repair electrical systems and equipment in residential, commercial, and industrial settings.',
  'Managers, All Other': 'Plan, direct, and coordinate activities in various organizational departments to achieve business objectives.',
  'Paralegals & Legal Assistants': 'Assist lawyers by conducting legal research, preparing documents, and organizing case files and evidence.',
  'Financial Managers': 'Direct financial activities of organizations including investment decisions, risk management, and financial planning.',
  'Medical & Health Services Managers': 'Plan, direct, and coordinate medical and health services in hospitals, clinics, and other healthcare facilities.',
  'Elementary School Teachers': 'Teach academic subjects to elementary school students and help develop their fundamental learning skills.',
  'Securities, Commodities & Financial Services Sales Agents': 'Buy and sell securities, commodities, and financial services for clients and provide investment advice.',
  'Licensed Practical & Licensed Vocational Nurses': 'Provide basic nursing care under the supervision of registered nurses and doctors in healthcare settings.',
  'Property, Real Estate & Community Association Managers': 'Manage residential, commercial, or industrial properties and oversee community association operations.'
}

async function reviewAndUpdateSummaries() {
  console.log('Reviewing high demand occupation summaries...\n')
  
  try {
    // Get all high demand occupations
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, long_desc')
      .eq('job_kind', 'occupation')
      .order('title')
    
    if (error) {
      console.error('Error fetching jobs:', error)
      return
    }
    
    console.log(`Found ${jobs.length} high demand occupations\n`)
    
    // Review current summaries and show proposed changes
    for (const job of jobs) {
      const newSummary = consolidatedSummaries[job.title]
      
      if (newSummary) {
        console.log(`📋 ${job.title}`)
        console.log(`Current: ${job.long_desc || 'No description'}`)
        console.log(`New: ${newSummary}`)
        console.log('---')
        
        // Update the summary
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ long_desc: newSummary })
          .eq('id', job.id)
        
        if (updateError) {
          console.error(`Error updating ${job.title}:`, updateError)
        } else {
          console.log(`✅ Updated: ${job.title}\n`)
        }
      } else {
        console.log(`⚠️  No consolidated summary found for: ${job.title}`)
      }
    }
    
    console.log('✅ Summary consolidation complete!')
    
  } catch (error) {
    console.error('Error:', error)
  }
  
  // Force exit to avoid hanging
  setTimeout(() => process.exit(0), 2000)
}

reviewAndUpdateSummaries()
