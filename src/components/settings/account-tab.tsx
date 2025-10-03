'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { type Profile } from '@/hooks/useAuth'
import { ChangeEmailDialog } from './change-email-dialog'
import { DeleteAccountDialog } from './delete-account-dialog'
import { Save } from 'lucide-react'

interface AccountTabProps {
  profile: Profile
}

export function AccountTab({ profile }: AccountTabProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [zipCode, setZipCode] = useState(profile.zip_code || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/user/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip_code: zipCode })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update account')
      }

      toast({
        title: 'Account updated',
        description: 'Your account settings have been saved successfully.'
      })
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update account',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Management</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email (Read-only) */}
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
            Email
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="flex-1 bg-white text-gray-900"
            />
            <ChangeEmailDialog currentEmail={profile.email} />
          </div>
        </div>

        {/* ZIP Code */}
        <div>
          <Label htmlFor="zip_code" className="text-sm font-medium text-gray-700 mb-2 block">
            Zip Code
          </Label>
          <Input
            id="zip_code"
            type="text"
            placeholder="Enter 5-digit zip code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            maxLength={5}
            pattern="[0-9]{5}"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Zip codes will be used in later versions of SkillSync to surface jobs and programs in your area.
          </p>
        </div>

        {/* Submit Button */}
        <div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-teal-600 hover:bg-[#114B5F] text-white px-6 flex items-center gap-2"
          >
            {loading ? 'Updating...' : 'Update Account Settings'}
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Delete Account Section */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Danger Zone</h3>
          <p className="text-sm text-gray-600">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <DeleteAccountDialog />
        </div>
      </div>
    </div>
  )
}
