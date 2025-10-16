'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import PageHeader from '@/components/ui/page-header'
import StickyTabs from '@/components/ui/sticky-tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import DataTable from '@/components/ui/data-table'
import { jobSeekerInvitesTableColumns } from '@/lib/job-seeker-invites-table-config'
import { supabase } from '@/lib/supabase/client'
import { 
  markInvitationAsViewed,
  markInvitationAsApplied,
  markInvitationAsDeclined,
  archiveInvitation,
  reopenInvitation
} from '@/lib/services/employer-invitations'
import '@/styles/employer-invites-table.css'

interface Invitation {
  id: string
  user_id: string
  job_id: string
  company_id: string
  proficiency_pct: number
  status: string
  application_url: string
  assessment_id: string | null
  company: {
    name: string
    logo_url: string | null
  }
  job: {
    title: string
  }
}

export default function InvitationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const tabFromUrl = searchParams.get('tab') || 'active'
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'active'
    setActiveTab(tabFromUrl)
  }, [searchParams])

  // Load invitations
  useEffect(() => {
    if (!user) return
    loadInvitations()
  }, [user, activeTab])

  async function loadInvitations() {
    try {
      setLoading(true)
      
      // Fetch invitations
      let query = supabase
        .from('employer_invitations')
        .select('*')
        .eq('user_id', user!.id)

      if (activeTab === 'active') {
        query = query.neq('status', 'archived')
      } else {
        query = query.eq('status', 'archived')
      }

      const { data: invitationsData, error: invitationsError } = await query

      if (invitationsError) throw invitationsError
      
      if (!invitationsData || invitationsData.length === 0) {
        setInvitations([])
        return
      }

      // Manually fetch related data
      const companyIds = Array.from(new Set(invitationsData.map(inv => inv.company_id)))
      const jobIds = Array.from(new Set(invitationsData.map(inv => inv.job_id)))

      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .in('id', companyIds)

      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title')
        .in('id', jobIds)

      // Combine the data
      const enrichedInvitations = invitationsData.map(inv => ({
        ...inv,
        company: companies?.find(c => c.id === inv.company_id) || null,
        job: jobs?.find(j => j.id === inv.job_id) || null
      }))
      
      setInvitations(enrichedInvitations)
    } catch (error) {
      console.error('Error loading invitations:', error)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  async function handleRowAction(action: string, row: any) {
    try {
      switch (action) {
        case 'view-application':
          await markInvitationAsViewed(row.id)
          window.open(row.application_url, '_blank')
          break
        
        case 'mark-applied':
          await markInvitationAsApplied(row.id)
          break
        
        case 'mark-declined':
          await markInvitationAsDeclined(row.id)
          break
        
        case 'archive':
          await archiveInvitation(row.id)
          break
        
        case 'restore':
          await reopenInvitation(row.id)
          break
        
        case 'view-role':
          if (row.job_id) {
            router.push(`/jobs/${row.job_id}`)
          }
          break
        
        case 'view-assessment':
          if (row.assessment_id) {
            router.push(`/assessments?id=${row.assessment_id}`)
          } else {
            router.push('/assessments')
          }
          break
      }
      
      // Reload invitations after action
      await loadInvitations()
    } catch (error) {
      console.error(`Error performing action ${action}:`, error)
    }
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`/invitations?${params.toString()}`)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={60} text="Loading Invitations" />
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

  const loadingText = activeTab === 'active' ? 'Loading Active Invitations' : 'Loading Archived Invitations'

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader
        title="Manage Your Invites"
        subtitle="View and respond to employer invitations based on your assessment results."
        variant="split"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <StickyTabs 
          tabs={tabs}
          onTabChange={handleTabChange}
        />

        <DataTable
          data={invitations}
          columns={jobSeekerInvitesTableColumns}
          tableType="employer-invites"
          onRowAction={handleRowAction}
          isLoading={loading}
          loadingText={loadingText}
        />
      </div>
    </div>
  )
}
