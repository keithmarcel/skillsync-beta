'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { DeactivateAccountDialog } from './deactivate-account-dialog'
import { ChangePasswordDialog } from './change-password-dialog'
import { ChangeEmailDialog } from './change-email-dialog'

interface Company {
  id: string
  name: string
  is_published: boolean
}

interface AccountTabProps {
  company: Company
  onUpdate: () => void
}

export function AccountTab({ company, onUpdate }: AccountTabProps) {
  const { toast } = useToast()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isPublished, setIsPublished] = useState(company.is_published ?? true)

  const handleVisibilityToggle = async () => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_published: !isPublished })
        .eq('id', company.id)

      if (error) throw error

      setIsPublished(!isPublished)
      toast({
        title: 'Visibility updated',
        description: `Company profile ${!isPublished ? 'published' : 'unpublished'} successfully`
      })
      
      onUpdate()
    } catch (error) {
      console.error('Error updating visibility:', error)
      toast({
        title: 'Update failed',
        description: 'Failed to update visibility settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="space-y-8">
        {/* Company Visibility */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Company Visibility</h3>
          <p className="text-sm text-gray-600 mb-3">
            Control whether your company profile and featured roles are visible to job seekers.
          </p>
          <div className={`border rounded-lg p-4 ${isPublished ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {isPublished ? '✓ Published' : '○ Unpublished'}
                </p>
                <p className="text-xs text-gray-600">
                  {isPublished 
                    ? 'Your company profile and featured roles are visible to all job seekers.'
                    : 'Your company profile and featured roles are hidden from job seekers. Only you can see them.'}
                </p>
              </div>
              <Button
                onClick={handleVisibilityToggle}
                disabled={loading}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>

        {/* Account Security */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Account Security</h3>
          <p className="text-sm text-gray-600 mb-3">
            Manage your account credentials and security settings.
          </p>
          
          <div className="space-y-4">
            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                Email
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="flex-1 bg-white text-gray-900"
                />
                {profile?.email && <ChangeEmailDialog currentEmail={profile.email} />}
              </div>
            </div>

            {/* Password */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Password
              </Label>
              <ChangePasswordDialog />
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Danger Zone</h3>
          <p className="text-sm text-gray-600">
            Deactivating your account will hide your company profile and all featured roles. Only a SkillSync administrator can reactivate your account.
          </p>
          <DeactivateAccountDialog companyId={company.id} />
        </div>
      </div>
    </div>
  )
}
