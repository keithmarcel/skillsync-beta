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

interface ChangeEmailDialogProps {
  currentEmail: string
}

export function ChangeEmailDialog({ currentEmail }: ChangeEmailDialogProps) {
  const [open, setOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive'
      })
      return
    }

    // Check if email is the same
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      toast({
        title: 'Same email',
        description: 'Please enter a different email address.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const supabase = createSupabaseClient()

      // Update user email - Supabase will send confirmation email
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (error) throw error

      toast({
        title: 'Confirmation email sent',
        description: `We've sent a confirmation link to ${newEmail}. Please check your inbox and click the link to complete the email change.`
      })

      setOpen(false)
      setNewEmail('')
    } catch (error) {
      console.error('Error changing email:', error)
      toast({
        title: 'Failed to change email',
        description: error instanceof Error ? error.message : 'An error occurred while changing your email.',
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
          variant="link"
          className="text-teal-600 hover:text-teal-700 px-0"
        >
          Change Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              Enter your new email address. We'll send a confirmation link to verify the change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-email" className="text-sm font-medium text-gray-700">
                Current Email
              </Label>
              <Input
                id="current-email"
                type="email"
                value={currentEmail}
                disabled
                className="bg-gray-50 text-gray-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-email" className="text-sm font-medium text-gray-700">
                New Email Address
              </Label>
              <Input
                id="new-email"
                type="email"
                placeholder="Enter new email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setNewEmail('')
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !newEmail}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading ? 'Sending...' : 'Send Confirmation Email'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
