'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Save } from 'lucide-react'
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call - in production, save to user preferences table
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: 'Preferences updated',
      description: 'Your notification preferences have been saved successfully.'
    })
    
    setLoading(false)
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSave} className="space-y-8">
        {/* Email Notifications */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Email Notifications</h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose which emails you'd like to receive about your hiring activity.
          </p>
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="newCandidates" className="text-sm font-medium text-gray-900 cursor-pointer block">
                  New qualified candidates
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Get notified when candidates meet your role requirements
                </p>
              </div>
              <Switch
                id="newCandidates"
                checked={notifications.newCandidates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, newCandidates: checked })}
                className="data-[state=checked]:bg-cyan-800"
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="applications" className="text-sm font-medium text-gray-900 cursor-pointer block">
                  New applications
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Receive alerts when candidates apply to your featured roles
                </p>
              </div>
              <Switch
                id="applications"
                checked={notifications.applications}
                onCheckedChange={(checked) => setNotifications({ ...notifications, applications: checked })}
                className="data-[state=checked]:bg-cyan-800"
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="roleViews" className="text-sm font-medium text-gray-900 cursor-pointer block">
                  Role view notifications
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Get updates when job seekers view your featured roles
                </p>
              </div>
              <Switch
                id="roleViews"
                checked={notifications.roleViews}
                onCheckedChange={(checked) => setNotifications({ ...notifications, roleViews: checked })}
                className="data-[state=checked]:bg-cyan-800"
              />
            </div>
          </div>
        </div>

        {/* System Notifications */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">System Notifications</h3>
          <p className="text-sm text-gray-600 mb-4">
            Stay informed about platform updates and important announcements.
          </p>
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="systemUpdates" className="text-sm font-medium text-gray-900 cursor-pointer block">
                  System updates
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Important platform updates and new features
                </p>
              </div>
              <Switch
                id="systemUpdates"
                checked={notifications.systemUpdates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, systemUpdates: checked })}
                className="data-[state=checked]:bg-cyan-800"
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="weeklyDigest" className="text-sm font-medium text-gray-900 cursor-pointer block">
                  Weekly digest
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Summary of your hiring activity and insights
                </p>
              </div>
              <Switch
                id="weeklyDigest"
                checked={notifications.weeklyDigest}
                onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyDigest: checked })}
                className="data-[state=checked]:bg-cyan-800"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-teal-600 hover:bg-[#114B5F] text-white px-6 flex items-center gap-2"
          >
            {loading ? 'Updating...' : 'Update Notification Preferences'}
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
