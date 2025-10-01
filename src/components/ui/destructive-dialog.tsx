/**
 * Reusable Destructive Confirmation Dialog
 * 
 * A standardized pattern for destructive actions (delete, remove, etc.)
 * with confirmation dialog and toast notifications.
 * 
 * Usage:
 * <DestructiveDialog
 *   title="Delete Quiz"
 *   description="Are you sure you want to delete this quiz? This action cannot be undone."
 *   actionLabel="Delete"
 *   onConfirm={async () => { await deleteQuiz(id) }}
 *   onSuccess={() => toast({ title: "Quiz deleted successfully" })}
 *   onError={(error) => toast({ title: "Failed to delete quiz", description: error.message })}
 * >
 *   <Button variant="destructive">Delete</Button>
 * </DestructiveDialog>
 */

'use client'

import { useState, ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface DestructiveDialogProps {
  children: ReactNode
  title: string
  description: string
  actionLabel?: string
  cancelLabel?: string
  onConfirm: () => Promise<void>
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function DestructiveDialog({
  children,
  title,
  description,
  actionLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onSuccess,
  onError,
}: DestructiveDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Destructive action failed:', error)
      onError?.(error instanceof Error ? error : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
