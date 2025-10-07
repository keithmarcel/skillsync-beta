'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const router = useRouter()
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

  const handleViewRoleDetails = () => {
    // Use job_id from the invitation to navigate to role details
    if (invitation.job_id) {
      router.push(`/jobs/${invitation.job_id}`)
    } else if (invitation.job?.soc_code) {
      // Fallback to SOC code if job_id not available
      router.push(`/jobs?search=${encodeURIComponent(invitation.job.soc_code)}`)
    }
  }

  const handleViewAssessmentResults = () => {
    // Navigate to assessments page - could be enhanced to filter by assessment_id
    if (invitation.assessment_id) {
      router.push(`/assessments?id=${invitation.assessment_id}`)
    } else {
      router.push('/assessments')
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
        <span className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium bg-gray-200 text-gray-700 min-w-[120px]">
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
            className="bg-teal-600 hover:bg-[#114B5F] text-white min-w-[120px]"
          >
            View Application
          </Button>
        )
      case 'applied':
        return (
          <span className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium bg-gray-200 text-gray-700 min-w-[120px]">
            Applied
          </span>
        )
      case 'declined':
        return (
          <span className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium bg-red-100 text-red-800 min-w-[120px]">
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
              className="w-24 h-24 object-contain flex-shrink-0"
            />
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm font-semibold text-gray-900">
          {invitation.job?.title || 'Unknown Role'}
        </span>
      </td>
      <td className="px-4 py-4">
        <span className="text-sm text-gray-700">
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
                <DropdownMenuSeparator />
                {invitation.status === 'sent' && (
                  <>
                    <DropdownMenuItem onClick={handleMarkAsApplied}>
                      Mark as Applied
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMarkAsDeclined}>
                      Mark as Declined
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleViewRoleDetails}>
                  Role Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewAssessmentResults}>
                  Assessment Results
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchive}>
                  Archive Invite
                </DropdownMenuItem>
              </>
            )}
            {isArchived && (
              <>
                <DropdownMenuItem onClick={handleViewRoleDetails}>
                  Role Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewAssessmentResults}>
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
