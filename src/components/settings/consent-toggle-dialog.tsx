'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConsentToggleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'enable' | 'disable'
  invitationCount?: number
  onConfirm: () => void
}

export function ConsentToggleDialog({
  open,
  onOpenChange,
  action,
  invitationCount = 0,
  onConfirm
}: ConsentToggleDialogProps) {
  if (action === 'disable') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Sharing Assessment Results?</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                If you turn off result sharing, the following will happen:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>
                  <strong>{invitationCount} active invitation{invitationCount !== 1 ? 's' : ''}</strong> will be withdrawn from employer dashboards
                </li>
                <li>
                  Employers will no longer see your assessment results
                </li>
                <li>
                  You won't receive new invitations for roles you qualify for
                </li>
                <li>
                  You can re-enable sharing anytime in settings
                </li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                Note: Employers you've already applied to will still have access to your application.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Stop Sharing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Enable consent dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Sharing Assessment Results?</DialogTitle>
          <DialogDescription className="space-y-3">
            <p>
              When you enable result sharing:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                Employers can see your assessment scores for roles you qualify for
              </li>
              <li>
                You'll receive personal invitations to apply for matching roles
              </li>
              <li>
                Past assessments that meet employer thresholds will be shared
              </li>
              <li>
                You can turn this off anytime in settings
              </li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              You're in control: Employers can only see results for roles where you meet their qualification threshold.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Enable Sharing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
