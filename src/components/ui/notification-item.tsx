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
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
      data-testid="notification-item"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-gray-900 mb-2">
            New Invite from {invitation.company?.name || 'Unknown Company'}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            You've been invited to apply to the{' '}
            <span className="font-normal">{invitation.job?.title || 'Unknown Role'}</span> role.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleViewApplication}
          disabled={loading}
          className="border-teal-600 text-teal-600 hover:bg-teal-50 flex-shrink-0 h-10 px-6"
        >
          View Application
        </Button>
      </div>
    </div>
  )
}
