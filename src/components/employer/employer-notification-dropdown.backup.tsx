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
import { EmployerNotificationItem } from './employer-notification-item'
import { supabase } from '@/lib/supabase/client'
import { checkEmployerAdminAuth } from '@/lib/utils/auth-helpers'

interface EmployerNotification {
  id: string
  user_id: string
  job_id: string
  status: 'applied' | 'declined'
  responded_at: string
  is_read_by_employer: boolean
  user: {
    first_name: string
    last_name: string
  }
  job: {
    title: string
  }
}

interface EmployerNotificationDropdownProps {
  companyId: string
}

export function EmployerNotificationDropdown({ companyId }: EmployerNotificationDropdownProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<EmployerNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [effectiveCompanyId, setEffectiveCompanyId] = useState<string | null>(null)

  // Get effective company ID (respects ViewAs mode)
  useEffect(() => {
    async function getEffectiveCompany() {
      const authCheck = await checkEmployerAdminAuth()
      if (authCheck.authorized && authCheck.company_id) {
        setEffectiveCompanyId(authCheck.company_id)
      } else {
        setEffectiveCompanyId(companyId)
      }
    }
    getEffectiveCompany()
  }, [companyId])

  useEffect(() => {
    if (open && effectiveCompanyId) {
      loadNotifications()
    }
  }, [open, effectiveCompanyId])

  // Poll for updates every 30 seconds
  useEffect(() => {
    if (effectiveCompanyId) {
      loadUnreadCount()
      const interval = setInterval(loadUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [effectiveCompanyId])

  async function loadNotifications() {
    if (!effectiveCompanyId) return
    
    try {
      setLoading(true)
      
      // Fetch invitations
      const { data: invitations, error: invError } = await supabase
        .from('employer_invitations')
        .select('id, user_id, job_id, status, responded_at, is_read_by_employer')
        .eq('company_id', effectiveCompanyId)
        .in('status', ['applied', 'declined', 'hired'])
        .not('responded_at', 'is', null)
        .order('responded_at', { ascending: false })
        .limit(5)

      if (invError) throw invError
      if (!invitations || invitations.length === 0) {
        setNotifications([])
        setLoading(false)
        return
      }

      // Fetch related data in parallel for better performance
      const userIds = invitations.map(inv => inv.user_id)
      const jobIds = invitations.map(inv => inv.job_id)
      
      const [usersResult, jobsResult] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name').in('id', userIds),
        supabase.from('jobs').select('id, title').in('id', jobIds)
      ])

      // Combine data
      const combinedData = invitations
        .map(inv => {
          const user = usersResult.data?.find(u => u.id === inv.user_id)
          const job = jobsResult.data?.find(j => j.id === inv.job_id)
          if (!user || !job) return null
          
          return {
            ...inv,
            user: { first_name: user.first_name, last_name: user.last_name },
            job: { title: job.title }
          }
        })
        .filter((item): item is EmployerNotification => item !== null)
      
      setNotifications(combinedData)
    } catch (error) {
      console.error('Error loading employer notifications:', error)
      // Set empty array so UI shows "no updates" instead of loading forever
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  async function loadUnreadCount() {
    if (!effectiveCompanyId) return
    
    try {
      const { count, error } = await supabase
        .from('employer_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', effectiveCompanyId)
        .in('status', ['applied', 'declined', 'hired'])
        .not('responded_at', 'is', null)
        .eq('is_read_by_employer', false)

      if (error) throw error
      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  async function handleMarkAllAsRead() {
    if (!effectiveCompanyId) return
    
    try {
      const { error } = await supabase
        .from('employer_invitations')
        .update({ is_read_by_employer: true })
        .eq('company_id', effectiveCompanyId)
        .in('status', ['applied', 'declined', 'hired'])
        .eq('is_read_by_employer', false)

      if (error) throw error
      
      await loadNotifications()
      await loadUnreadCount()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  async function handleNotificationClick(notification: EmployerNotification) {
    try {
      // Mark as read
      await supabase
        .from('employer_invitations')
        .update({ is_read_by_employer: true })
        .eq('id', notification.id)

      // Navigate to invites tab
      router.push('/employer?tab=invites')
      setOpen(false)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  function handleManageInvites() {
    router.push('/employer?tab=invites')
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="employer-notification-trigger"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-[472px] p-1 bg-white border border-[#E5E5E5] rounded-lg shadow-md"
        sideOffset={20}
        data-testid="employer-notification-dropdown"
      >
        {/* Header */}
        <div className="px-4 py-2">
          <h3 className="text-base font-semibold text-[#111928]">
            Recent Candidate Updates
          </h3>
        </div>

        {/* Notifications List */}
        <div className="max-h-[494px] overflow-y-auto px-2 py-2 space-y-2">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">No candidate updates</p>
              <p className="text-xs text-gray-400 mt-1">
                You'll be notified when candidates respond to invitations
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <EmployerNotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer Actions - Always show */}
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
            onClick={handleManageInvites}
            className="flex-1 h-[34px] text-xs font-medium bg-[#0694A2] hover:bg-[#0694A2]/90 text-white"
          >
            Manage Invites
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
