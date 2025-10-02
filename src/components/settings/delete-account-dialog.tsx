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
import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast({
        title: 'Confirmation required',
        description: 'Please type DELETE to confirm account deletion.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      // Call API endpoint to delete account
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete account')
      }

      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.'
      })

      // Sign out and redirect to home
      const supabase = createSupabaseClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        title: 'Failed to delete account',
        description: error instanceof Error ? error.message : 'An error occurred while deleting your account.',
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
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-xl">Delete Account</DialogTitle>
          </div>
          <DialogDescription className="pt-3 text-base">
            Are you absolutely sure you want to delete your account? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <h4 className="text-sm font-semibold text-red-900 mb-2">This will permanently delete:</h4>
            <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
              <li>Your profile and account information</li>
              <li>All your assessment results and progress</li>
              <li>Your saved jobs and programs</li>
              <li>All notification preferences</li>
              <li>Any other data associated with your account</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm font-medium text-gray-900">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              type="text"
              placeholder="Type DELETE to confirm"
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
            onClick={handleDelete}
            disabled={loading || confirmText !== 'DELETE'}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
