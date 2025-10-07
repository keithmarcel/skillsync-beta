'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import PageHeader from '@/components/ui/page-header'
import StickyTabs from '@/components/ui/sticky-tabs'
import { EmployerDashboard } from '@/components/employer/employer-dashboard'
import { EmployerRolesTable } from '@/components/employer/employer-roles-table'
import { EmployerInvitesTable } from '@/components/employer/employer-invites-table'
import { EmployerSettings } from '@/components/employer/employer-settings'
import { supabase } from '@/lib/supabase/client'

interface Company {
  id: string
  name: string
  logo_url: string | null
  city: string | null
  state: string | null
}

export default function EmployerDashboardPage() {
  const { user, profile, loading: authLoading, isEmployerAdmin } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const tabFromUrl = searchParams.get('tab') || 'dashboard'
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  // Update activeTab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'dashboard'
    setActiveTab(tabFromUrl)
  }, [searchParams])

  // Load company data for employer
  useEffect(() => {
    async function loadCompanyData() {
      if (!user || !profile) return

      try {
        setLoading(true)
        
        // Get company associated with this employer
        const { data: companyData, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single()

        if (error) throw error
        setCompany(companyData)
      } catch (error) {
        console.error('Error loading company data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCompanyData()
  }, [user, profile])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`/employer?${params.toString()}`)
  }

  // Auth checks
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user || !isEmployerAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Access denied. Employer admin access required.</div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">No company associated with your account.</div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', isActive: activeTab === 'dashboard' },
    { id: 'roles', label: 'Listed Roles', isActive: activeTab === 'roles' },
    { id: 'invites', label: 'Invites', isActive: activeTab === 'invites' },
    { id: 'settings', label: 'Settings', isActive: activeTab === 'settings' }
  ]

  // Determine location text
  const locationText = company.city && company.state 
    ? `Top High Demand Jobs in ${company.city}` 
    : 'Manage your profile details such as name, avatar, email and bio.'

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader
        title={`Welcome, ${company.name}!`}
        subtitle={locationText}
        variant="split"
      />

      <main className="max-w-[1280px] mx-auto px-6">
        <StickyTabs 
          tabs={tabs}
          onTabChange={handleTabChange}
        />

        <div className="mt-8">
          {activeTab === 'dashboard' && (
            <EmployerDashboard company={company} />
          )}
          
          {activeTab === 'roles' && (
            <EmployerRolesTable companyId={company.id} />
          )}
          
          {activeTab === 'invites' && (
            <EmployerInvitesTable companyId={company.id} />
          )}
          
          {activeTab === 'settings' && (
            <EmployerSettings company={company} />
          )}
        </div>
      </main>
    </div>
  )
}
