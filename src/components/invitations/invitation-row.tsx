'use client'

import { useState } from 'react'
import { MoreHorizontal, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  markInvitationAsViewed,
  markInvitationAsApplied,
  markInvitationAsDeclined,
  archiveInvitation,
  reopenInvitation
} from '@/lib/services/employer-invitations'
import type { EmployerInvitation } from '@/lib/services/employer-invitations'

interface InvitationRowProps {
  invitation: EmployerInvitation
  isSelected: boolean
  onSelect: (checked: boolean) => void
  isArchived: boolean
  onUpdate: () => void
}

export function InvitationRow({ invitation, isSelected, onSelect, isArchived, onUpdate }: InvitationRowProps) {
  const [loading, setLoading] = useState(false)

  const handleViewApplication = async () => {
    try {
      setLoading(true)
      await markInvitationAsViewed(invitation.id)
      window.open(invitation.application_url, '_blank')
      onUpdate()
    } catch (error) {
      console.error('Error marking as viewed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsApplied = async () => {
    try {
      setLoading(true)
      await markInvitationAsApplied(invitation.id)
      onUpdate()
    } catch (error) {
      console.error('Error marking as applied:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsDeclined = async () => {
    try {
      setLoading(true)
      await markInvitationAsDeclined(invitation.id)
      onUpdate()
    } catch (error) {
      console.error('Error marking as declined:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    try {
      setLoading(true)
      await archiveInvitation(invitation.id)
      onUpdate()
    } catch (error) {
      console.error('Error archiving:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    try {
      setLoading(true)
      await reopenInvitation(invitation.id)
      onUpdate()
    } catch (error) {
      console.error('Error restoring:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReadinessBadge = () => {
    if (invitation.proficiency_pct >= 90) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
          Ready
        </span>
      )
    } else if (invitation.proficiency_pct >= 85) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
          Building Skills
        </span>
      )
    }
    return null
  }

  const getStatusBadge = () => {
    if (isArchived) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-700">
          Archived
        </span>
      )
    }

    switch (invitation.status) {
      case 'sent':
      case 'pending':
        return (
          <Button
            size="sm"
            onClick={handleViewApplication}
            disabled={loading}
            className="bg-teal-600 hover:bg-[#114B5F] text-white"
          >
            View Application
          </Button>
        )
      case 'applied':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-700">
            Applied
          </span>
        )
      case 'declined':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
            Declined
          </span>
        )
      default:
        return null
    }
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {invitation.company?.logo_url && (
            <img
              src={invitation.company.logo_url}
              alt={invitation.company.name || ''}
              className="w-10 h-10 object-contain"
            />
          )}
          <span className="text-sm font-semibold text-gray-900">
            {invitation.company?.name || 'Unknown Company'}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm text-gray-700">
          {invitation.job?.title || 'Unknown Role'}
        </span>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm font-medium text-gray-900">
          {invitation.proficiency_pct}%
        </span>
      </td>
      <td className="px-4 py-4">
        {getReadinessBadge()}
      </td>
      <td className="px-4 py-4">
        {getStatusBadge()}
      </td>
      <td className="px-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={loading}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {!isArchived && (
              <>
                <DropdownMenuItem onClick={handleViewApplication}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Application
                </DropdownMenuItem>
                {invitation.status === 'sent' && (
                  <>
                    <DropdownMenuItem onClick={handleMarkAsApplied}>
                      Mark as Applied
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMarkAsDeclined}>
                      Mark as Declined
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem>
                  Role Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Assessment Results
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchive}>
                  Archive Invite
                </DropdownMenuItem>
              </>
            )}
            {isArchived && (
              <>
                <DropdownMenuItem>
                  Role Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Assessment Results
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRestore}>
                  Restore Invite
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
