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
import { NotificationItem } from './notification-item'
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
        className="w-96 p-0"
        data-testid="notification-dropdown"
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-base font-semibold text-gray-900">
            Invite Notifications
          </h3>
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : invitations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No new invitations</p>
              <p className="text-xs text-gray-400 mt-1">
                Complete assessments to receive invitations from employers
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {invitations.map((invitation) => (
                <NotificationItem
                  key={invitation.id}
                  invitation={invitation}
                  onClick={handleInvitationClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {invitations.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="flex-1"
              disabled={unreadCount === 0}
            >
              Mark All As Read
            </Button>
            <Button
              size="sm"
              onClick={handleViewAll}
              className="flex-1 bg-teal-600 hover:bg-[#114B5F] text-white"
            >
              View All Invites
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
