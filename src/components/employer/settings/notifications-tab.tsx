'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Bell, Mail, Users, Briefcase, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface NotificationsTabProps {
  company: {
    id: string
    name: string
  }
}

export function NotificationsTab({ company }: NotificationsTabProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState({
    newCandidates: true,
    applications: true,
    roleViews: false,
    systemUpdates: true,
    weeklyDigest: true
  })

  const handleSave = async () => {
    setLoading(true)
    
    // Simulate API call - in production, save to user preferences table
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: 'Success',
      description: 'Notification preferences updated successfully'
    })
    
    setLoading(false)
  }

  const NotificationToggle = ({ 
    icon: Icon, 
    title, 
    description, 
    enabled, 
    onChange 
  }: { 
    icon: any
    title: string
    description: string
    enabled: boolean
    onChange: (value: boolean) => void
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-200 last:border-0">
      <div className="flex items-start gap-3 flex-1">
        <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
        <div>
          <Label className="text-sm font-medium text-gray-900">{title}</Label>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
          enabled ? 'bg-teal-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Email Notifications */}
      <div>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Choose which emails you'd like to receive about your hiring activity.
          </p>

          <div className="space-y-0">
            <NotificationToggle
              icon={Users}
              title="New Qualified Candidates"
              description="Get notified when candidates meet your role requirements"
              enabled={notifications.newCandidates}
              onChange={(value) => setNotifications({ ...notifications, newCandidates: value })}
            />
            
            <NotificationToggle
              icon={Briefcase}
              title="New Applications"
              description="Receive alerts when candidates apply to your featured roles"
              enabled={notifications.applications}
              onChange={(value) => setNotifications({ ...notifications, applications: value })}
            />
            
            <NotificationToggle
              icon={Bell}
              title="Role View Notifications"
              description="Get updates when job seekers view your featured roles"
              enabled={notifications.roleViews}
              onChange={(value) => setNotifications({ ...notifications, roleViews: value })}
            />
          </div>
      </div>

      {/* System Notifications */}
      <div>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">System Notifications</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Stay informed about platform updates and important announcements.
          </p>

          <div className="space-y-0">
            <NotificationToggle
              icon={Bell}
              title="System Updates"
              description="Important platform updates and new features"
              enabled={notifications.systemUpdates}
              onChange={(value) => setNotifications({ ...notifications, systemUpdates: value })}
            />
            
            <NotificationToggle
              icon={Mail}
              title="Weekly Digest"
              description="Summary of your hiring activity and insights"
              enabled={notifications.weeklyDigest}
              onChange={(value) => setNotifications({ ...notifications, weeklyDigest: value })}
            />
          </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  )
}
