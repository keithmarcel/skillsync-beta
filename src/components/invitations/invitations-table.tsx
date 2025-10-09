'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { InvitationRow } from './invitation-row'
import { BulkActionsDropdown } from './bulk-actions-dropdown'
import { InvitationFilters } from './invitation-filters'
import type { EmployerInvitation } from '@/lib/services/employer-invitations'

interface InvitationsTableProps {
  invitations: EmployerInvitation[]
  loading: boolean
  isArchived: boolean
  onUpdate: () => void
}

export function InvitationsTable({ invitations, loading, isArchived, onUpdate }: InvitationsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [readinessFilter, setReadinessFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filter invitations
  const filteredInvitations = invitations.filter(inv => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const companyName = inv.company?.name?.toLowerCase() || ''
      const jobTitle = inv.job?.title?.toLowerCase() || ''
      if (!companyName.includes(query) && !jobTitle.includes(query)) {
        return false
      }
    }

    // Readiness filter
    if (readinessFilter !== 'All') {
      if (readinessFilter === 'Ready' && inv.proficiency_pct < 90) return false
      if (readinessFilter === 'Almost There' && (inv.proficiency_pct < 85 || inv.proficiency_pct >= 90)) return false
    }

    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Pending' && inv.status !== 'sent') return false
      if (statusFilter === 'Applied' && inv.status !== 'applied') return false
      if (statusFilter === 'Declined' && inv.status !== 'declined') return false
    }

    return true
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredInvitations.map(inv => inv.id)))
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

  const handleBulkActionComplete = () => {
    setSelectedIds(new Set())
    onUpdate()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading invitations...</div>
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isArchived ? 'No Archived Invitations' : 'No Invitations Yet'}
        </h3>
        <p className="text-gray-600">
          {isArchived 
            ? 'You haven\'t archived any invitations.'
            : 'Complete assessments to receive invitations from employers.'}
        </p>
      </div>
    )
  }

  const allSelected = filteredInvitations.length > 0 && selectedIds.size === filteredInvitations.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredInvitations.length

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
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

        {/* Filters and Bulk Actions */}
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <InvitationFilters
            readinessFilter={readinessFilter}
            statusFilter={statusFilter}
            onReadinessChange={setReadinessFilter}
            onStatusChange={setStatusFilter}
            isArchived={isArchived}
          />
          
          {selectedIds.size > 0 && (
            <BulkActionsDropdown
              selectedIds={Array.from(selectedIds)}
              isArchived={isArchived}
              onComplete={handleBulkActionComplete}
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
                  Company
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
                <InvitationRow
                  key={invitation.id}
                  invitation={invitation}
                  isSelected={selectedIds.has(invitation.id)}
                  onSelect={(checked) => handleSelectOne(invitation.id, checked)}
                  isArchived={isArchived}
                  onUpdate={onUpdate}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvitations.length === 0 && invitations.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            No invitations match your filters.
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredInvitations.length} of {invitations.length} invitation{invitations.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
