'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import PageHeader from '@/components/ui/page-header'
import StickyTabs from '@/components/ui/sticky-tabs'
import { InvitationsTable } from '@/components/invitations/invitations-table'
import { getUserInvitations, getUserArchivedInvitations } from '@/lib/services/employer-invitations'
import type { EmployerInvitation } from '@/lib/services/employer-invitations'

export default function InvitationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const tabFromUrl = searchParams.get('tab') || 'active'
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const [invitations, setInvitations] = useState<EmployerInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'active'
    setActiveTab(tabFromUrl)
  }, [searchParams])

  // Load invitations
  useEffect(() => {
    if (!user) return

    async function loadInvitations() {
      setLoading(true)
      setError(null)
      
      try {
        const data = activeTab === 'active' 
          ? await getUserInvitations()
          : await getUserArchivedInvitations()
        
        setInvitations(data)
      } catch (err) {
        console.error('Error loading invitations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load invitations')
      } finally {
        setLoading(false)
      }
    }

    loadInvitations()
  }, [user, activeTab])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`/invitations?${params.toString()}`)
  }

  const handleInvitationUpdate = () => {
    // Reload invitations after update
    if (user) {
      const loadData = async () => {
        const data = activeTab === 'active' 
          ? await getUserInvitations()
          : await getUserArchivedInvitations()
        setInvitations(data)
      }
      loadData()
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Please sign in to view invitations.</div>
      </div>
    )
  }

  const tabs = [
    { id: 'active', label: 'Active', isActive: activeTab === 'active' },
    { id: 'archived', label: 'Archived', isActive: activeTab === 'archived' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader
        title="Manage Your Invites"
        subtitle="View and respond to employer invitations based on your assessment results."
        variant="split"
      />

      <StickyTabs 
        tabs={tabs}
        onTabChange={handleTabChange}
      />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        ) : (
          <InvitationsTable
            invitations={invitations}
            loading={loading}
            isArchived={activeTab === 'archived'}
            onUpdate={handleInvitationUpdate}
          />
        )}
      </div>
    </div>
  )
}
