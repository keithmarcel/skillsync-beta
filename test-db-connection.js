// Test database connection and data
import { createBrowserClient } from '@supabase/ssr'

// Use local development URLs
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  
  try {
    // Test basic connection
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
    
    console.log('Companies query result:', { companies, companiesError })
    
    // Test jobs query
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_kind', 'featured_role')
    
    console.log('Featured roles query result:', { jobs, jobsError })
    
    // Test high-demand jobs
    const { data: highDemandJobs, error: highDemandError } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_kind', 'high_demand')
    
    console.log('High-demand jobs query result:', { highDemandJobs, highDemandError })
    
  } catch (error) {
    console.error('Connection test failed:', error)
  }
}

testConnection()
