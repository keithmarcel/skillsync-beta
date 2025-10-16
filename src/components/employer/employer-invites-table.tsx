'use client'

import { useState, useEffect } from 'react'
import { Search, MoreHorizontal, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LoadingState } from '@/components/ui/loading-state'
import { EmployerBulkActions } from './employer-bulk-actions'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { 
  sendInvitationToCandidate, 
  markCandidateAsHired, 
  markCandidateAsUnqualified, 
  archiveCandidate 
} from '@/lib/services/employer-invitations'

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

export function EmployerInvitesTable({ companyId }: EmployerInvitesTableProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [rolesFilter, setRolesFilter] = useState('all')
  const [readinessFilter, setReadinessFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeSubTab, setActiveSubTab] = useState('active')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    loadInvitations()
  }, [companyId, activeSubTab])

  async function loadInvitations() {
    try {
      setLoading(true)
      
      console.log('Loading invitations for company:', companyId)
      console.log('Active sub-tab:', activeSubTab)
      
      // Fetch invitations without joins (workaround for schema cache issue)
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
        console.log('No invitations found')
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
      
      console.log('📊 Loaded invitations:', enrichedInvitations)
      console.log('📊 Invitation count:', enrichedInvitations.length)
      console.log('📊 Users loaded:', users)
      console.log('📊 Jobs loaded:', jobs)
      
      setInvitations(enrichedInvitations)
    } catch (error) {
      console.error('Error loading invitations:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
    } finally {
      setLoading(false)
    }
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, rolesFilter, readinessFilter, statusFilter])

  const filteredInvitations = invitations.filter(inv => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const name = `${inv.user?.first_name} ${inv.user?.last_name}`.toLowerCase()
      const role = inv.job?.title?.toLowerCase() || ''
      if (!name.includes(query) && !role.includes(query)) return false
    }

    if (rolesFilter !== 'all') {
      // Filter by specific role - would need job_id comparison
    }

    if (readinessFilter === 'ready' && inv.proficiency_pct < 90) return false
    if (readinessFilter === 'building' && (inv.proficiency_pct < 85 || inv.proficiency_pct >= 90)) return false

    if (statusFilter !== 'all' && inv.status !== statusFilter) return false

    return true
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all on current page
      const newSelected = new Set(selectedIds)
      paginatedInvitations.forEach(inv => newSelected.add(inv.id))
      setSelectedIds(newSelected)
    } else {
      // Deselect all on current page
      const newSelected = new Set(selectedIds)
      paginatedInvitations.forEach(inv => newSelected.delete(inv.id))
      setSelectedIds(newSelected)
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSendInvite = async (invitationId: string) => {
    try {
      await sendInvitationToCandidate(invitationId)
      loadInvitations()
    } catch (error) {
      console.error('Error sending invitation:', error)
    }
  }

  const handleMarkHired = async (invitationId: string) => {
    try {
      await markCandidateAsHired(invitationId)
      loadInvitations()
    } catch (error) {
      console.error('Error marking as hired:', error)
    }
  }

  const handleMarkUnqualified = async (invitationId: string) => {
    try {
      await markCandidateAsUnqualified(invitationId)
      loadInvitations()
    } catch (error) {
      console.error('Error marking as unqualified:', error)
    }
  }

  const handleArchive = async (invitationId: string) => {
    try {
      await archiveCandidate(invitationId)
      loadInvitations()
    } catch (error) {
      console.error('Error archiving invitation:', error)
    }
  }

  const getReadinessBadge = (proficiency: number) => {
    if (proficiency >= 90) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
          Ready
        </span>
      )
    } else if (proficiency >= 85) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
          Almost There
        </span>
      )
    }
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium bg-gray-200 text-gray-700 min-w-[120px]">
            Invite Sent
          </span>
        )
      case 'applied':
        return (
          <span className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium bg-teal-100 text-teal-800 min-w-[120px] gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Applied
          </span>
        )
      case 'declined':
        return (
          <span className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium bg-red-100 text-red-800 min-w-[120px] gap-1.5">
            <X className="w-3.5 h-3.5" />
            Declined
          </span>
        )
      case 'hired':
        return (
          <span className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium bg-purple-100 text-purple-800 min-w-[120px]">
            Hired
          </span>
        )
      case 'unqualified':
        return (
          <span className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium border border-gray-300 bg-white text-gray-700 min-w-[120px]">
            Unqualified
          </span>
        )
      case 'archived':
        return (
          <span className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium bg-gray-200 text-gray-700 min-w-[120px]">
            Archived
          </span>
        )
      default:
        return null
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredInvitations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvitations = filteredInvitations.slice(startIndex, endIndex)

  const allSelected = paginatedInvitations.length > 0 && paginatedInvitations.every(inv => selectedIds.has(inv.id))
  const someSelected = selectedIds.size > 0 && !allSelected

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Your Invites</h2>
        <LoadingState variant="skeleton" count={6} size="lg" className="mt-6" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Manage Your Invites</h2>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent rounded-none border-b border-gray-200">
          <TabsTrigger 
            value="active"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0694A2] data-[state=active]:text-[#0694A2] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-4 pt-0 text-sm font-medium text-gray-600 hover:text-gray-900 -mb-px"
          >
            Active
          </TabsTrigger>
          <TabsTrigger 
            value="archived"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0694A2] data-[state=active]:text-[#0694A2] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-4 pt-0 ml-4 text-sm font-medium text-gray-600 hover:text-gray-900 -mb-px"
          >
            Archived
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeSubTab} className="mt-6">

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 items-center w-full sm:w-auto flex-wrap">
          <Select value={rolesFilter} onValueChange={setRolesFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Roles: Show All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Roles: Show All</SelectItem>
            </SelectContent>
          </Select>

          <Select value={readinessFilter} onValueChange={setReadinessFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Readiness: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Readiness: All</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="building">Almost There</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status: All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.size > 0 && (
            <EmployerBulkActions
              selectedIds={Array.from(selectedIds)}
              isArchived={activeSubTab === 'archived'}
              onComplete={() => {
                setSelectedIds(new Set())
                loadInvitations()
              }}
            />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Proficiency
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role Readiness
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center w-20 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedInvitations.map((invitation) => (
                <tr key={invitation.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(invitation.id)}
                      onChange={(e) => handleSelectOne(invitation.id, e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {invitation.user?.avatar_url ? (
                        <img
                          src={invitation.user.avatar_url}
                          alt={`${invitation.user.first_name} ${invitation.user.last_name}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {invitation.user?.first_name?.[0]}{invitation.user?.last_name?.[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {invitation.user?.first_name} {invitation.user?.last_name}
                        </span>
                        {invitation.proficiency_pct >= 95 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#0694A2]/10 text-teal-800 mt-1">
                            Top Performer
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {invitation.job?.title}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm text-gray-900">
                      {invitation.proficiency_pct}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {getReadinessBadge(invitation.proficiency_pct)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {invitation.status === 'pending' ? (
                      <Button
                        size="sm"
                        onClick={() => handleSendInvite(invitation.id)}
                        className="bg-teal-600 hover:bg-[#114B5F] text-white min-w-[120px]"
                      >
                        Invite to Apply
                      </Button>
                    ) : (
                      getStatusBadge(invitation.status)
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {invitation.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleSendInvite(invitation.id)}>
                            Invite to Apply
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => invitation.user?.linkedin_url && window.open(invitation.user.linkedin_url, '_blank')}
                          disabled={!invitation.user?.linkedin_url}
                        >
                          View LinkedIn
                        </DropdownMenuItem>
                        {invitation.status !== 'pending' && invitation.status !== 'hired' && invitation.status !== 'unqualified' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleMarkHired(invitation.id)}>
                              Mark as Hired
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkUnqualified(invitation.id)}>
                              Mark as Unqualified
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchive(invitation.id)}>
                          Archive Candidate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvitations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No invitations found.
          </div>
        )}
      </div>

      {/* Pagination and count */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredInvitations.length)} of {filteredInvitations.length} invitation{filteredInvitations.length !== 1 ? 's' : ''}
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 text-xs"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3 text-xs"
            >
              Next
            </Button>
          </div>
        )}
      </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
