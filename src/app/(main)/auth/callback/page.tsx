'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/signin?error=callback_failed')
          return
        }

        if (data.session) {
          // Fetch user profile to determine correct redirect
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_id, school_id, admin_role')
            .eq('id', data.session.user.id)
            .single()
          
          // Redirect based on user type
          if (profile?.company_id) {
            // Employer user - redirect to employer dashboard
            router.push('/employer')
          } else if (profile?.school_id) {
            // Provider admin - redirect to provider dashboard
            router.push('/provider')
          } else if (profile?.admin_role === 'super_admin') {
            // Super admin - redirect to admin
            router.push('/admin')
          } else {
            // Job seeker - redirect to homepage
            router.push('/')
          }
        } else {
          // No session, redirect to sign in
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/auth/signin?error=unexpected')
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0694A2] mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
