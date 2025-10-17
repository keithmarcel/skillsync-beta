'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SectionWithTabs } from '@/components/ui/section-with-tabs'
import { ProfileTab } from './settings/profile-tab-v2'
import { AccountTab } from './settings/account-tab-v2'
import { NotificationsTab } from './settings/notifications-tab-v2'
import { supabase } from '@/lib/supabase/client'

interface Company {
  id: string
  name: string
  logo_url: string | null
  featured_image_url: string | null
  bio: string | null
  hq_city: string | null
  hq_state: string | null
  industry: string | null
  employee_range: string | null
  revenue_range: string | null
  is_published: boolean
  is_trusted_partner: boolean
}

interface EmployerSettingsProps {
  company: Company
}

export function EmployerSettings({ company: initialCompany }: EmployerSettingsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [company, setCompany] = useState<Company>(initialCompany)
  
  const tabFromUrl = searchParams.get('subtab') || 'profile'
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  
  useEffect(() => {
    const tabFromUrl = searchParams.get('subtab') || 'profile'
    setActiveTab(tabFromUrl)
  }, [searchParams])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('subtab', tabId)
    router.push(`/employer?tab=settings&${params.toString()}`)
  }

  const handleCompanyUpdate = async () => {
    // Refresh company data from database
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company.id)
      .single()

    if (!error && data) {
      setCompany(data)
    }
  }

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      content: <ProfileTab company={company} onUpdate={handleCompanyUpdate} />
    },
    {
      id: 'account',
      label: 'Account',
      content: <AccountTab company={company} onUpdate={handleCompanyUpdate} />
    },
    {
      id: 'notifications',
      label: 'Notifications',
      content: <NotificationsTab company={company} />
    }
  ]

  return (
    <SectionWithTabs
      heading="Manage Your Settings"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  )
}
