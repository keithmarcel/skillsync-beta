'use client'

import { useViewAs } from '@/contexts/ViewAsContext'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Eye, X } from 'lucide-react'
import { Button } from './ui/button'

export function ViewAsBanner() {
  const { viewAsMode, setViewAsMode, isViewingAs } = useViewAs()
  const { isSuperAdmin } = useAuth()
  const router = useRouter()

  if (!isViewingAs || !isSuperAdmin) {
    return null
  }

  const getLabel = () => {
    switch (viewAsMode) {
      case 'employer_admin':
        return 'Employer Admin'
      case 'provider_admin':
        return 'Provider Admin'
      case 'user':
        return 'Regular User'
      default:
        return 'Unknown'
    }
  }

  const handleClose = () => {
    setViewAsMode(null)
    router.push('/admin')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-lg px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-600" />
            <div className="text-sm">
              <span className="font-medium text-amber-900">Viewing as {getLabel()}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
