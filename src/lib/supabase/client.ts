import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Force local development URLs for now
  const supabaseUrl = 'http://127.0.0.1:54321'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  
  console.log('Supabase client connecting to:', supabaseUrl)
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createClient()
