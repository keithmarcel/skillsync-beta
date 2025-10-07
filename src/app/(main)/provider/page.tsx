'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import PageHeader from '@/components/ui/page-header'
import StickyTabs from '@/components/ui/sticky-tabs'
import { ProviderDashboard } from '@/components/provider/provider-dashboard'
import { ProviderProgramsTable } from '@/components/provider/provider-programs-table'
import { ProviderSettings } from '@/components/provider/provider-settings'
import { supabase } from '@/lib/supabase/client'

interface School {
  id: string
  name: string
  logo_url: string | null
  city: string | null
  state: string | null
}

export default function ProviderDashboardPage() {
  const { user, profile, loading: authLoading, isProviderAdmin } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const tabFromUrl = searchParams.get('tab') || 'dashboard'
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)

  // Update activeTab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'dashboard'
    setActiveTab(tabFromUrl)
  }, [searchParams])

  // Load school data for provider
  useEffect(() => {
    async function loadSchoolData() {
      if (!user || !profile) return

      try {
        setLoading(true)
        
        // Get school associated with this provider
        const { data: schoolData, error } = await supabase
          .from('schools')
          .select('*')
          .eq('id', profile.school_id)
          .single()

        if (error) throw error
        setSchool(schoolData)
      } catch (error) {
        console.error('Error loading school data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSchoolData()
  }, [user, profile])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`/provider?${params.toString()}`)
  }

  // Auth checks
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user || !isProviderAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Access denied. Provider admin access required.</div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">No school associated with your account.</div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', isActive: activeTab === 'dashboard' },
    { id: 'programs', label: 'Listed Programs', isActive: activeTab === 'programs' },
    { id: 'settings', label: 'Settings', isActive: activeTab === 'settings' }
  ]

  // Determine location text
  const locationText = school.city && school.state 
    ? `Top High Demand Jobs in ${school.city}` 
    : 'Manage Your Programs'

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader
        title={`Welcome, ${school.name}!`}
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
            <ProviderDashboard school={school} />
          )}
          
          {activeTab === 'programs' && (
            <ProviderProgramsTable schoolId={school.id} />
          )}
          
          {activeTab === 'settings' && (
            <ProviderSettings school={school} />
          )}
        </div>
      </main>
    </div>
  )
}
