'use client'

import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'

interface EmployerNotificationItemProps {
  notification: {
    id: string
    user_id: string
    job_id: string
    status: 'applied' | 'declined' | 'hired' | 'sent'
    responded_at: string
    viewed_at?: string
    is_read_by_employer: boolean
    user: {
      first_name: string
      last_name: string
    }
    job: {
      title: string
    }
  }
  onClick?: () => void
}

export function EmployerNotificationItem({ notification, onClick }: EmployerNotificationItemProps) {
  const candidateName = `${notification.user.first_name} ${notification.user.last_name}`
  
  // Determine notification type based on status and viewed_at
  const isViewedNotification = notification.status === 'sent' && notification.viewed_at
  
  const getStatusBadge = () => {
    if (isViewedNotification) {
      return (
        <Badge className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 border border-blue-200 flex-shrink-0 shadow-none h-[31px] px-4 text-[11px] font-medium leading-[150%]">
          <Check className="w-3.5 h-3.5" />
          Viewed
        </Badge>
      )
    }
    
    switch (notification.status) {
      case 'applied':
        return (
          <Badge className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-800 border border-teal-200 flex-shrink-0 shadow-none h-[31px] px-4 text-[11px] font-medium leading-[150%]">
            <Check className="w-3.5 h-3.5" />
            Applied
          </Badge>
        )
      case 'hired':
        return (
          <Badge className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 border border-green-200 flex-shrink-0 shadow-none h-[31px] px-4 text-[11px] font-medium leading-[150%]">
            <Check className="w-3.5 h-3.5" />
            Hired
          </Badge>
        )
      case 'declined':
        return (
          <Badge className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 border border-red-200 flex-shrink-0 shadow-none h-[31px] px-4 text-[11px] font-medium leading-[150%]">
            <X className="w-3.5 h-3.5" />
            Declined
          </Badge>
        )
    }
  }

  const getUpdateMessage = () => {
    if (isViewedNotification) {
      return (
        <>
          This candidate has viewed the application for the{' '}
          <span className="font-semibold">{notification.job.title}</span> role.
        </>
      )
    }
    
    switch (notification.status) {
      case 'applied':
        return (
          <>
            This candidate has applied for the{' '}
            <span className="font-semibold">{notification.job.title}</span> role.
          </>
        )
      case 'hired':
        return (
          <>
            This candidate has been hired for the{' '}
            <span className="font-semibold">{notification.job.title}</span> role.
          </>
        )
      case 'declined':
        return (
          <>
            This candidate has declined the invitation for the{' '}
            <span className="font-semibold">{notification.job.title}</span> role.
          </>
        )
    }
  }

  return (
    <div 
      className="bg-white border border-[#E5E7EB] rounded-lg p-4 w-full"
      onClick={onClick}
      data-testid="employer-notification-item"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-bold text-[#111928] leading-[150%] mb-1 font-source-sans-pro">
            New update from {candidateName}
          </h4>
          <p className="text-sm font-normal text-[#4B5563] leading-[150%]">
            {getUpdateMessage()}
          </p>
        </div>
        {getStatusBadge()}
      </div>
    </div>
  )
}
