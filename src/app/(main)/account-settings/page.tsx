'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import PageHeader from '@/components/ui/page-header'
import StickyTabs from '@/components/ui/sticky-tabs'
import { ProfileTab } from '@/components/settings/profile-tab'
import { AccountTab } from '@/components/settings/account-tab'
import { NotificationsTab } from '@/components/settings/notifications-tab'

export default function SettingsPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const tabFromUrl = searchParams.get('tab') || 'profile'
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'profile'
    setActiveTab(tabFromUrl)
  }, [searchParams])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Please sign in to access settings.</div>
      </div>
    )
  }

  // Dynamic subtitle based on active tab
  const getSubtitle = () => {
    switch (activeTab) {
      case 'profile':
        return 'Manage your profile information, avatar, and privacy settings.'
      case 'account':
        return 'Update your account details and manage your SkillSync account.'
      case 'notifications':
        return 'Control how and when you receive notifications from SkillSync.'
      default:
        return 'Manage your profile information, avatar, and privacy settings.'
    }
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`/account-settings?${params.toString()}`)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', isActive: activeTab === 'profile' },
    { id: 'account', label: 'Account', isActive: activeTab === 'account' },
    { id: 'notifications', label: 'Notifications', isActive: activeTab === 'notifications' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader
        title="Account Settings"
        subtitle={getSubtitle()}
        variant="split"
      />

      <StickyTabs 
        tabs={tabs}
        onTabChange={handleTabChange}
      />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="w-full max-w-[672px]">
            {activeTab === 'profile' && <ProfileTab profile={profile} />}
            {activeTab === 'account' && <AccountTab profile={profile} />}
            {activeTab === 'notifications' && <NotificationsTab profile={profile} />}
          </div>
        </div>
      </div>
    </div>
  )
}
