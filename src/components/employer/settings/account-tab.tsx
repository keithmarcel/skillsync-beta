'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Company {
  id: string
  name: string
  is_published: boolean
  is_trusted_partner: boolean
}

interface AccountTabProps {
  company: Company
  onUpdate: () => void
}

export function AccountTab({ company, onUpdate }: AccountTabProps) {
  const { toast } = useToast()
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
        title: 'Success',
        description: `Company profile ${!isPublished ? 'published' : 'unpublished'} successfully`
      })
      
      onUpdate()
    } catch (error) {
      console.error('Error updating visibility:', error)
      toast({
        title: 'Error',
        description: 'Failed to update visibility settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Company Visibility */}
      <div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isPublished ? (
                  <Eye className="w-5 h-5 text-teal-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">Company Visibility</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Control whether your company profile and featured roles are visible to job seekers.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {isPublished ? '✓ Published' : '○ Unpublished'}
                </p>
                <p className="text-xs text-gray-600">
                  {isPublished 
                    ? 'Your company profile and featured roles are visible to all job seekers.'
                    : 'Your company profile and featured roles are hidden from job seekers. Only you can see them.'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleVisibilityToggle}
              disabled={loading}
              variant={isPublished ? 'outline' : 'default'}
              className={isPublished ? '' : 'bg-teal-600 hover:bg-teal-700'}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isPublished ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
      </div>

      {/* Trusted Partner Status */}
      <div>
          <div className="flex items-start gap-3">
            <Shield className={`w-5 h-5 ${company.is_trusted_partner ? 'text-teal-600' : 'text-gray-400'}`} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Trusted Partner Status</h3>
              <p className="text-sm text-gray-600 mb-4">
                Trusted partners receive a special badge on their featured roles and company profile.
              </p>
              <div className={`rounded-lg p-4 ${company.is_trusted_partner ? 'bg-teal-50 border border-teal-200' : 'bg-gray-50 border border-gray-200'}`}>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {company.is_trusted_partner ? '✓ Trusted Partner' : '○ Standard Partner'}
                </p>
                <p className="text-xs text-gray-600">
                  {company.is_trusted_partner
                    ? 'Your company has been verified as a trusted partner by SkillSync administrators.'
                    : 'Contact SkillSync support to learn about becoming a trusted partner.'}
                </p>
              </div>
              {!company.is_trusted_partner && (
                <p className="text-xs text-gray-500 mt-3">
                  This status can only be changed by SkillSync administrators.
                </p>
              )}
            </div>
          </div>
      </div>

      {/* Account Security */}
      <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
          <p className="text-sm text-gray-600 mb-4">
            Manage your account credentials and security settings.
          </p>
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => {
                toast({
                  title: 'Coming Soon',
                  description: 'Password change functionality will be available soon.'
                })
              }}
            >
              Change Password
            </Button>
          </div>
      </div>
    </div>
  )
}
