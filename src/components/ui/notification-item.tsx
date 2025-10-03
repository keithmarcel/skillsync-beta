'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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

  return (
    <div 
      className="bg-white border border-[#E5E7EB] rounded-lg p-4 w-full hover:bg-gray-50 transition-colors cursor-pointer"
      data-testid="notification-item"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#111928] leading-[150%] mb-1">
            New Invite from {invitation.company?.name || 'Unknown Company'}
          </h4>
          <p className="text-sm font-normal text-[#4B5563] leading-[150%]">
            You've been invited to apply to the{' '}
            <span className="font-semibold">{invitation.job?.title || 'Unknown Role'}</span> role.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleViewApplication}
          disabled={loading}
          className="border-[#036672] text-[#036672] hover:bg-[#036672]/5 flex-shrink-0 h-[31px] px-4 text-[11px] font-medium leading-[150%]"
        >
          View Application
        </Button>
      </div>
    </div>
  )
}
