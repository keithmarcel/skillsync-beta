'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'
import { markInvitationAsViewed } from '@/lib/services/employer-invitations'
import type { EmployerInvitation } from '@/lib/services/employer-invitations'

interface NotificationItemProps {
  invitation: EmployerInvitation
  onClick?: () => void
}

export function NotificationItem({ invitation, onClick }: NotificationItemProps) {
  const [loading, setLoading] = useState(false)

  const handleViewApplication = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      setLoading(true)
      await markInvitationAsViewed(invitation.id)
      window.open(invitation.application_url, '_blank')
      onClick?.()
    } catch (error) {
      console.error('Error marking as viewed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check if this is a status update notification (employer changed status)
  const isStatusUpdate = invitation.status === 'hired' || invitation.status === 'unqualified'
  
  const getStatusBadge = () => {
    if (invitation.status === 'hired') {
      return (
        <Badge className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 border border-green-200 flex-shrink-0 shadow-none h-[31px] px-4 text-[11px] font-medium leading-[150%]">
          <Check className="w-3.5 h-3.5" />
          Hired
        </Badge>
      )
    }
    if (invitation.status === 'unqualified') {
      return (
        <Badge className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 border border-gray-200 flex-shrink-0 shadow-none h-[31px] px-4 text-[11px] font-medium leading-[150%]">
          Position Filled
        </Badge>
      )
    }
    return null
  }

  const getNotificationMessage = () => {
    if (invitation.status === 'hired') {
      return (
        <>
          Congratulations! You've been hired for the{' '}
          <span className="font-semibold">{invitation.job?.title || 'Unknown Role'}</span> role.
        </>
      )
    }
    if (invitation.status === 'unqualified') {
      return (
        <>
          The{' '}
          <span className="font-semibold">{invitation.job?.title || 'Unknown Role'}</span>{' '}
          position has been filled.
        </>
      )
    }
    // Default: new invitation
    return (
      <>
        You've been invited to apply to the{' '}
        <span className="font-semibold">{invitation.job?.title || 'Unknown Role'}</span> role.
      </>
    )
  }

  return (
    <div 
      className="bg-white border border-[#E5E7EB] rounded-lg p-4 w-full hover:bg-gray-50 transition-colors cursor-pointer"
      data-testid="notification-item"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-bold text-[#111928] leading-[150%] mb-1 font-source-sans-pro">
            {isStatusUpdate 
              ? `Status update from ${invitation.company?.name || 'Unknown Company'}`
              : `New invite from ${invitation.company?.name || 'Unknown Company'}`
            }
          </h4>
          <p className="text-sm font-normal text-[#4B5563] leading-[150%]">
            {getNotificationMessage()}
          </p>
        </div>
        {isStatusUpdate ? (
          getStatusBadge()
        ) : (
          <Button
            variant="outline"
            onClick={handleViewApplication}
            disabled={loading}
            className="border-[#036672] text-[#036672] hover:bg-[#036672] hover:text-white hover:border-[#036672] flex-shrink-0 h-[31px] px-4 text-[11px] font-medium leading-[150%]"
          >
            View Application
          </Button>
        )}
      </div>
    </div>
  )
}
