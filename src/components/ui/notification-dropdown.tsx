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
  markInvitationAsViewed,
  markAllInvitationsAsRead
} from '@/lib/services/employer-invitations'
import { supabase } from '@/lib/supabase/client'
import type { EmployerInvitation } from '@/lib/services/employer-invitations'

export function NotificationDropdown() {
  const router = useRouter()
  const [invitations, setInvitations] = useState<EmployerInvitation[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isOptedIn, setIsOptedIn] = useState<boolean | null>(null)

  // Load invitations and unread count
  useEffect(() => {
    loadNotifications()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      // Check if user is opted in to employer invites
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('visible_to_employers')
          .eq('id', user.id)
          .single()
        
        setIsOptedIn(profile?.visible_to_employers ?? false)
      }
      
      const [invites, count] = await Promise.all([
        getRecentInvitations(5), // Get top 5 recent
        getUnreadInvitationCount()
      ])
      
      setInvitations(invites)
      setUnreadCount(count)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const handleInvitationClick = async (invitation: EmployerInvitation) => {
    try {
      // Mark as viewed when clicked
      await markInvitationAsViewed(invitation.id)
      
      // Navigate to invitations page
      router.push('/invitations')
      setOpen(false)
    } catch (error) {
      console.error('Error marking invitation as viewed:', error)
    }
  }

  const handleViewAll = () => {
    setOpen(false)
    router.push('/invitations')
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllInvitationsAsRead()
      loadNotifications() // Refresh after marking all as read
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
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
        <div className="px-4 py-2">
          <h3 className="text-base font-semibold text-[#111928]">
            Recent Invite Notifications
          </h3>
        </div>

        {/* Notifications List */}
        <div className="max-h-[494px] overflow-y-auto px-2 py-2 space-y-2">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : isOptedIn === false ? (
            <div className="py-8 px-4 text-center">
              <p className="text-sm font-medium text-gray-900 mb-2">Enable Employer Invites</p>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Get personally invited to roles you qualify for! Opt in to let employers view your assessment results and invite you to apply.
              </p>
              <Button
                onClick={() => {
                  router.push('/account-settings?tab=profile')
                  setOpen(false)
                }}
                className="w-full bg-[#0694A2] hover:bg-[#0694A2]/90 text-white text-xs"
              >
                Enable in Account Settings
              </Button>
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
                  onClick={() => handleInvitationClick(invitation)}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer Actions - Only show if user is opted in */}
        {isOptedIn && (
          <div className="px-4 py-6 flex gap-3">
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="flex-1 h-[34px] text-xs font-medium border-[#036672] text-[#036672] hover:bg-[#036672] hover:text-white hover:border-[#036672]"
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
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
