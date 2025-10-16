'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import DataTable from '@/components/ui/data-table'
import { employerInvitesTableColumns } from '@/lib/employer-invites-table-config'
import { supabase } from '@/lib/supabase/client'
import { 
  sendInvitationToCandidate, 
  markCandidateAsHired, 
  markCandidateAsUnqualified, 
  archiveCandidate,
  reopenCandidate
} from '@/lib/services/employer-invitations'
import '@/styles/employer-invites-table.css'

interface Invitation {
  id: string
  user_id: string
  job_id: string
  proficiency_pct: number
  status: string
  user: {
    first_name: string
    last_name: string
    avatar_url: string | null
    linkedin_url: string | null
  }
  job: {
    title: string
    required_proficiency_pct: number
  }
}

interface EmployerInvitesTableProps {
  companyId: string
}

export function EmployerInvitesTableV2({ companyId }: EmployerInvitesTableProps) {
  const searchParams = useSearchParams()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [filteredInvitations, setFilteredInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState('active')

  // Apply URL filter whenever invitations or searchParams change
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam && invitations.length > 0) {
      console.log('Applying filter from URL:', filterParam)
      const filtered = invitations.filter(inv => {
        if (filterParam === 'pending') return inv.status === 'pending'
        if (filterParam === 'applied') return inv.status === 'applied'
        return true
      })
      setFilteredInvitations(filtered)
    } else {
      setFilteredInvitations(invitations)
    }
  }, [invitations, searchParams])

  useEffect(() => {
    loadInvitations()
  }, [companyId, activeSubTab])

  async function loadInvitations() {
    try {
      setLoading(true)
      
      // Fetch invitations
      let query = supabase
        .from('employer_invitations')
        .select('*')
        .eq('company_id', companyId)

      if (activeSubTab === 'active') {
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
      const userIds = Array.from(new Set(invitationsData.map(inv => inv.user_id)))
      const jobIds = Array.from(new Set(invitationsData.map(inv => inv.job_id)))

      const { data: users } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, linkedin_url')
        .in('id', userIds)

      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, required_proficiency_pct')
        .in('id', jobIds)

      // Combine the data
      const enrichedInvitations = invitationsData.map(inv => ({
        ...inv,
        user: users?.find(u => u.id === inv.user_id) || null,
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

  const handleRowAction = async (action: string, row: any) => {
    try {
      console.log(`[Employer Action] ${action} for invitation:`, row.id)
      
      switch (action) {
        case 'send-invite':
          await sendInvitationToCandidate(row.id)
          console.log('[Employer Action] Invitation sent successfully')
          break
        case 'view-linkedin':
          if (row.user?.linkedin_url) {
            window.open(row.user.linkedin_url, '_blank')
          }
          break
        case 'mark-hired':
          await markCandidateAsHired(row.id)
          console.log('[Employer Action] Marked as hired successfully')
          break
        case 'mark-unqualified':
          console.log('[Employer Action] Marking as unqualified...')
          await markCandidateAsUnqualified(row.id)
          console.log('[Employer Action] Marked as unqualified successfully')
          break
        case 'archive':
          await archiveCandidate(row.id)
          console.log('[Employer Action] Archived successfully')
          break
        case 'restore':
          await reopenCandidate(row.id)
          console.log('[Employer Action] Restored successfully')
          break
      }
      
      console.log('[Employer Action] Reloading invitations...')
      await loadInvitations()
      console.log('[Employer Action] Invitations reloaded')
    } catch (error) {
      console.error(`[Employer Action] ERROR performing ${action}:`, error)
      alert(`Failed to ${action.replace('-', ' ')}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const loadingText = activeSubTab === 'active' ? 'Loading Active Invites' : 'Loading Archived Invites'

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 font-source-sans-pro">Manage Your Invites</h2>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <DataTable
            data={filteredInvitations}
            columns={employerInvitesTableColumns}
            tableType="employer-invites"
            onRowAction={handleRowAction}
            showSearchSortFilter={true}
            isLoading={loading}
            loadingText="Loading Active Invites"
          />
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          <DataTable
            data={filteredInvitations}
            columns={employerInvitesTableColumns}
            tableType="employer-invites"
            onRowAction={handleRowAction}
            showSearchSortFilter={true}
            isLoading={loading}
            loadingText="Loading Archived Invites"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
