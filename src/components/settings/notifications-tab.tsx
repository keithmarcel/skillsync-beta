'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { type Profile } from '@/hooks/useAuth'
import { Save } from 'lucide-react'

interface NotificationsTabProps {
  profile: Profile
}

export function NotificationsTab({ profile }: NotificationsTabProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    notif_in_app_invites: profile.notif_in_app_invites ?? true,
    notif_in_app_new_roles: profile.notif_in_app_new_roles ?? true,
    notif_email_new_roles: profile.notif_email_new_roles ?? true,
    notif_email_invites: profile.notif_email_invites ?? true,
    notif_email_marketing: profile.notif_email_marketing ?? false,
    notif_email_security: profile.notif_email_security ?? true,
    notif_all_disabled: profile.notif_all_disabled ?? false
  })

  const handleToggleAll = (checked: boolean) => {
    setFormData({
      notif_in_app_invites: !checked,
      notif_in_app_new_roles: !checked,
      notif_email_new_roles: !checked,
      notif_email_invites: !checked,
      notif_email_marketing: !checked,
      notif_email_security: !checked,
      notif_all_disabled: checked
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update notifications')
      }

      toast({
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved successfully.'
      })
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update preferences',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* In-App Notifications */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">In-App Notifications</h3>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label htmlFor="notif_in_app_invites" className="text-sm font-medium text-gray-900 cursor-pointer block">
                    New application invites from employers
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Receive emails about new products, features, and more.
                  </p>
                </div>
                <Switch
                  id="notif_in_app_invites"
                  checked={formData.notif_in_app_invites}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, notif_in_app_invites: checked })
                  }
                  disabled={formData.notif_all_disabled}
                  className="data-[state=checked]:bg-cyan-800"
                />
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label htmlFor="notif_in_app_new_roles" className="text-sm font-medium text-gray-900 cursor-pointer block">
                    New roles and occupations added to SkillSync
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Send notifications to device.
                  </p>
                </div>
                <Switch
                  id="notif_in_app_new_roles"
                  checked={formData.notif_in_app_new_roles}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, notif_in_app_new_roles: checked })
                  }
                  disabled={formData.notif_all_disabled}
                  className="data-[state=checked]:bg-cyan-800"
                />
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label htmlFor="notif_email_new_roles" className="text-sm font-medium text-gray-900 cursor-pointer block">
                    New roles and occupations added to SkillSync
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Send notifications to device.
                  </p>
                </div>
                <Switch
                  id="notif_email_new_roles"
                  checked={formData.notif_email_new_roles}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, notif_email_new_roles: checked })
                  }
                  disabled={formData.notif_all_disabled}
                  className="data-[state=checked]:bg-cyan-800"
                />
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label htmlFor="notif_email_invites" className="text-sm font-medium text-gray-900 cursor-pointer block">
                    New application invites from employers
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Receive emails about new products, features, and more.
                  </p>
                </div>
                <Switch
                  id="notif_email_invites"
                  checked={formData.notif_email_invites}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, notif_email_invites: checked })
                  }
                  disabled={formData.notif_all_disabled}
                  className="data-[state=checked]:bg-cyan-800"
                />
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label htmlFor="notif_email_marketing" className="text-sm font-medium text-gray-900 cursor-pointer block">
                    Marketing emails
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Receive emails about new products, features, and more.
                  </p>
                </div>
                <Switch
                  id="notif_email_marketing"
                  checked={formData.notif_email_marketing}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, notif_email_marketing: checked })
                  }
                  disabled={formData.notif_all_disabled}
                  className="data-[state=checked]:bg-cyan-800"
                />
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label htmlFor="notif_email_security" className="text-sm font-medium text-gray-900 cursor-pointer block">
                    Security emails
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Receive emails about your account activity and security.
                  </p>
                </div>
                <Switch
                  id="notif_email_security"
                  checked={formData.notif_email_security}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, notif_email_security: checked })
                  }
                  disabled={formData.notif_all_disabled}
                  className="data-[state=checked]:bg-cyan-800"
                />
              </div>
            </div>
          </div>

          {/* Turn Off All */}
          <div className="pt-6 border-t border-gray-200">
            <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label htmlFor="notif_all_disabled" className="text-sm font-medium text-gray-900 cursor-pointer block">
                  Turn off all notifications
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Setting description here
                </p>
              </div>
              <Switch
                id="notif_all_disabled"
                checked={formData.notif_all_disabled}
                onCheckedChange={handleToggleAll}
                className="data-[state=checked]:bg-cyan-800"
              />
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
