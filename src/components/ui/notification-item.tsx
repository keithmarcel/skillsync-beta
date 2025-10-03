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
      className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
        !invitation.is_read ? 'bg-blue-50' : ''
      }`}
      data-testid="notification-item"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            New Invite from {invitation.company?.name || 'Unknown Company'}
          </h4>
          <p className="text-sm text-gray-600">
            You've been invited to apply to the{' '}
            <span className="font-medium">{invitation.job?.title || 'Unknown Role'}</span> role.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleViewApplication}
          disabled={loading}
          className="border-teal-600 text-teal-600 hover:bg-teal-50 flex-shrink-0"
        >
          View Application
        </Button>
      </div>
      
      {/* Unread indicator */}
      {!invitation.is_read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
      )}
    </div>
  )
}
