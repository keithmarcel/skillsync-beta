'use client'

import { useState, useEffect } from 'react'
import { Search, MoreHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { sendInvitation, markAsHired, markAsUnqualified, archiveInvitation } from '@/lib/services/employer-invitations'

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
  }
  job: {
    title: string
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

  useEffect(() => {
    loadInvitations()
  }, [companyId, activeSubTab])

  async function loadInvitations() {
    try {
      setLoading(true)
      
      let query = supabase
        .from('employer_invitations')
        .select(`
          *,
          user:profiles!employer_invitations_user_id_fkey(first_name, last_name, avatar_url),
          job:jobs!employer_invitations_job_id_fkey(title)
        `)
        .eq('company_id', companyId)

      if (activeSubTab === 'active') {
        query = query.neq('status', 'archived')
      } else {
        query = query.eq('status', 'archived')
      }

      const { data, error } = await query

      if (error) throw error
      setInvitations(data || [])
    } catch (error) {
      console.error('Error loading invitations:', error)
    } finally {
      setLoading(false)
    }
  }

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
      setSelectedIds(new Set(filteredInvitations.map(i => i.id)))
    } else {
      setSelectedIds(new Set())
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
      await sendInvitation(invitationId)
      loadInvitations()
    } catch (error) {
      console.error('Error sending invitation:', error)
    }
  }

  const handleMarkHired = async (invitationId: string) => {
    try {
      await markAsHired(invitationId)
      loadInvitations()
    } catch (error) {
      console.error('Error marking as hired:', error)
    }
  }

  const handleMarkUnqualified = async (invitationId: string) => {
    try {
      await markAsUnqualified(invitationId)
      loadInvitations()
    } catch (error) {
      console.error('Error marking as unqualified:', error)
    }
  }

  const handleArchive = async (invitationId: string) => {
    try {
      await archiveInvitation(invitationId)
      loadInvitations()
    } catch (error) {
      console.error('Error archiving invitation:', error)
    }
  }

  const getReadinessBadge = (proficiency: number) => {
    if (proficiency >= 90) {
      return <Badge className="bg-teal-100 text-teal-800 border-0">Ready</Badge>
    }
    return <Badge className="bg-orange-100 text-orange-800 border-0">Building Skills</Badge>
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800' },
      applied: { label: 'Applied', className: 'bg-green-100 text-green-800' },
      declined: { label: 'Declined', className: 'bg-red-100 text-red-800' },
      hired: { label: 'Hired', className: 'bg-purple-100 text-purple-800' },
      unqualified: { label: 'Unqualified', className: 'bg-gray-100 text-gray-800' },
      archived: { label: 'Archived', className: 'bg-gray-100 text-gray-800' }
    }

    const config = statusMap[status] || statusMap.pending
    return <Badge className={`${config.className} border-0`}>{config.label}</Badge>
  }

  const allSelected = filteredInvitations.length > 0 && selectedIds.size === filteredInvitations.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredInvitations.length

  if (loading) {
    return <div className="text-center py-12">Loading invitations...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Manage Your Invites</h2>

      {/* Sub-tabs for Active/Archived */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === 'active'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveSubTab('archived')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === 'archived'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
              <SelectItem value="building">Building Skills</SelectItem>
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
            <Button variant="outline" className="border-teal-600 text-teal-600">
              Bulk Actions
            </Button>
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Proficiency
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role Readiness
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-20 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvitations.map((invitation) => (
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
                      <span className="text-sm font-semibold text-gray-900">
                        {invitation.user?.first_name} {invitation.user?.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">
                      {invitation.job?.title}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">
                      {invitation.proficiency_pct}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {getReadinessBadge(invitation.proficiency_pct)}
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(invitation.status)}
                  </td>
                  <td className="px-4 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {invitation.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleSendInvite(invitation.id)}>
                            Mark as Hired
                          </DropdownMenuItem>
                        )}
                        {invitation.status === 'sent' && (
                          <>
                            <DropdownMenuItem onClick={() => handleMarkHired(invitation.id)}>
                              Mark as Hired
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkUnqualified(invitation.id)}>
                              Mark as Unqualified
                            </DropdownMenuItem>
                          </>
                        )}
                        {activeSubTab === 'active' && (
                          <DropdownMenuItem onClick={() => handleArchive(invitation.id)}>
                            Restore Candidate
                          </DropdownMenuItem>
                        )}
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

      <div className="text-sm text-gray-600">
        Showing {filteredInvitations.length} of {invitations.length} invitation{invitations.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
