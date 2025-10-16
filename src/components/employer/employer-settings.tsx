'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 font-source-sans-pro">Manage Your Settings</h2>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <div className="flex justify-center mt-6">
          <div className="w-full max-w-[672px]">
            <TabsContent value="profile" className="mt-0">
              <ProfileTab company={company} onUpdate={handleCompanyUpdate} />
            </TabsContent>
            <TabsContent value="account" className="mt-0">
              <AccountTab company={company} onUpdate={handleCompanyUpdate} />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0">
              <NotificationsTab company={company} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
