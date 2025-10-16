'use client'

import { useState, useEffect, useLayoutEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useViewAs } from '@/contexts/ViewAsContext'
import PageHeader from '@/components/ui/page-header'
import StickyTabs from '@/components/ui/sticky-tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmployerDashboard } from '@/components/employer/employer-dashboard-new'
import { EmployerRolesTableV2 as EmployerRolesTable } from '@/components/employer/employer-roles-table-v2'
import { EmployerInvitesTableV2 as EmployerInvitesTable } from '@/components/employer/employer-invites-table-v2'
import { EmployerSettings } from '@/components/employer/employer-settings'
import { supabase } from '@/lib/supabase/client'

interface Company {
  id: string
  name: string
  logo_url: string | null
  hq_city: string | null
  hq_state: string | null
}

export default function EmployerDashboardPage() {
  const { user, profile, loading: authLoading, isEmployerAdmin, isSuperAdmin } = useAuth()
  const { viewAsMode } = useViewAs()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const tabFromUrl = searchParams.get('tab') || 'dashboard'
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  // Force scroll to top immediately - multiple approaches for reliability
  if (typeof window !== 'undefined') {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }

  useLayoutEffect(() => {
    // Disable scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [])

  // Update activeTab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'dashboard'
    setActiveTab(tabFromUrl)
  }, [searchParams])

  // Load company data for employer (only once)
  useEffect(() => {
    async function loadCompanyData() {
      if (!user || !profile) return
      if (company) return // Already loaded, don't reload

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
  }, [user, profile, company])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`/employer?${params.toString()}`)
  }

  // Auth checks
  if (authLoading || loading) {
    // Get company name - show actual name if loaded, otherwise show loading state
    const companyName = company?.name || 'Power Design'
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner 
          size={80} 
          text={`Loading Dashboard for ${companyName}`}
        />
      </div>
    )
  }

  // Allow access if user is employer admin OR super admin viewing as employer
  const hasAccess = isEmployerAdmin || (isSuperAdmin && viewAsMode === 'employer_admin')
  
  if (!user || !hasAccess) {
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

  // Determine subtitle text based on active tab
  const getSubtitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Track your hiring pipeline and candidate engagement'
      case 'roles':
        return 'Create and manage your featured role listings'
      case 'invites':
        return 'Review candidates and manage invitation workflow'
      case 'settings':
        return 'Update company profile and preferences'
      default:
        return 'Manage your roles, invitations, and company settings'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader
        title={`Welcome, ${company.name}!`}
        subtitle={getSubtitle()}
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
