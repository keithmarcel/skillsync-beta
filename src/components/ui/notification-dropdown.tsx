'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationItem } from '@/components/ui/notification-item'
import { 
  getRecentInvitations, 
  getUnreadInvitationCount,
  markAllInvitationsAsRead 
} from '@/lib/services/employer-invitations'
import type { EmployerInvitation } from '@/lib/services/employer-invitations'

export function NotificationDropdown() {
  const router = useRouter()
  const [invitations, setInvitations] = useState<EmployerInvitation[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  // Load invitations and unread count
  useEffect(() => {
    loadNotifications()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const [invites, count] = await Promise.all([
        getRecentInvitations(5), // Get top 5 recent
        getUnreadInvitationCount()
      ])
      
      setInvitations(invites)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllInvitationsAsRead()
      setUnreadCount(0)
      loadNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleViewAll = () => {
    setOpen(false)
    router.push('/invitations')
  }

  const handleInvitationClick = () => {
    loadNotifications() // Refresh after interaction
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-[472px] p-1 bg-white border border-[#E5E5E5] rounded-lg shadow-md"
        sideOffset={20}
        data-testid="notification-dropdown"
      >
        {/* Header */}
        <div className="px-4 py-2 border-b border-[#E5E5E5]">
          <h3 className="text-base font-normal text-[#111928]">
            Recent Invite Notifications
          </h3>
        </div>

        {/* Notifications List */}
        <div className="max-h-[494px] overflow-y-auto px-2 py-2 space-y-2">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : invitations.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">No new invitations</p>
              <p className="text-xs text-gray-400 mt-1">
                Complete assessments to receive invitations from employers
              </p>
            </div>
          ) : (
            <>
              {invitations.map((invitation) => (
                <NotificationItem
                  key={invitation.id}
                  invitation={invitation}
                  onClick={handleInvitationClick}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer Actions - Always visible for easy access to invitations page */}
        <div className="px-4 py-6 flex gap-3">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="flex-1 h-[34px] text-xs font-medium border-[#E5E7EB] text-[#111928] hover:bg-gray-50"
            disabled={unreadCount === 0}
          >
            Mark All As Read
          </Button>
          <Button
            onClick={handleViewAll}
            className="flex-1 h-[34px] text-xs font-medium bg-[#0694A2] hover:bg-[#0694A2]/90 text-white"
          >
            View All Invites
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
