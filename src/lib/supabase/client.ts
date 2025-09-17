import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  console.log('Supabase client connecting to:', supabaseUrl)
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createClient()
