'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

interface DeactivateAccountDialogProps {
  companyId: string
}

export function DeactivateAccountDialog({ companyId }: DeactivateAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDeactivate = async () => {
    if (confirmText !== 'DEACTIVATE') {
      toast({
        title: 'Confirmation required',
        description: 'Please type DEACTIVATE to confirm account deactivation.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      // Unpublish the company
      const { error } = await supabase
        .from('companies')
        .update({ is_published: false })
        .eq('id', companyId)

      if (error) throw error

      toast({
        title: 'Account deactivated',
        description: 'Your company account has been deactivated. Contact support to reactivate.'
      })

      // Sign out and redirect to employer portal
      await supabase.auth.signOut()
      window.location.href = '/employer/auth/signin'
    } catch (error) {
      console.error('Error deactivating account:', error)
      toast({
        title: 'Deactivation failed',
        description: error instanceof Error ? error.message : 'An error occurred while deactivating your account.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Deactivate Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-xl">Deactivate Account</DialogTitle>
          </div>
          <DialogDescription className="pt-3 text-base">
            Are you sure you want to deactivate your company account? Only a SkillSync administrator can reactivate it.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <h4 className="text-sm font-semibold text-red-900 mb-2">This will:</h4>
            <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
              <li>Hide your company profile from job seekers</li>
              <li>Unpublish all your featured roles</li>
              <li>Prevent candidates from viewing or applying to your roles</li>
              <li>Preserve your data for potential reactivation</li>
              <li>Require administrator approval to reactivate</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-deactivate" className="text-sm font-medium text-gray-900">
              Type <span className="font-bold text-red-600">DEACTIVATE</span> to confirm
            </Label>
            <Input
              id="confirm-deactivate"
              type="text"
              placeholder="Type DEACTIVATE to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false)
              setConfirmText('')
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeactivate}
            disabled={loading || confirmText !== 'DEACTIVATE'}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Deactivating...' : 'Deactivate My Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
