'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/ui/footer'
import { ViewAsBanner } from '@/components/ViewAsBanner'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile } = useAuth()
  const isAuthPage = pathname?.startsWith('/auth/') || 
                     pathname === '/employer/auth/signin' || 
                     pathname === '/provider/auth/signin'
  const isLegalPage = pathname?.startsWith('/legal/')
  const isEmployerPage = pathname?.startsWith('/employer') && !pathname?.startsWith('/employer/auth')
  
  const [companyData, setCompanyData] = useState<{ id: string; name: string; logo_url: string | null } | null>(null)

  // Load company data for employer pages
  useEffect(() => {
    async function loadCompany() {
      if (!isEmployerPage || !profile?.company_id) return
      
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, logo_url')
          .eq('id', profile.company_id)
          .single()
        
        if (!error && data) {
          setCompanyData(data)
        }
      } catch (error) {
        console.error('Error loading company for navbar:', error)
      }
    }
    
    loadCompany()
  }, [isEmployerPage, profile?.company_id])

  if (isAuthPage) {
    return (
      <div className="h-screen overflow-hidden">
        {children}
      </div>
    )
  }

  if (isLegalPage) {
    return <>{children}</>
  }

  return (
    <>
      <ViewAsBanner />
      <Navbar 
        variant={isEmployerPage ? 'employer' : 'default'}
        companyId={isEmployerPage ? companyData?.id : undefined}
        companyName={isEmployerPage ? companyData?.name : undefined}
        companyLogo={isEmployerPage ? companyData?.logo_url : undefined}
      />
      <main className="min-h-screen pt-12 sm:pt-20">
        {children}
      </main>
      <Footer />
    </>
  )
}
