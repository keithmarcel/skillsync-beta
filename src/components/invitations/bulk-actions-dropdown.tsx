'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { bulkArchiveInvitations } from '@/lib/services/employer-invitations'

interface BulkActionsDropdownProps {
  selectedIds: string[]
  isArchived: boolean
  onComplete: () => void
}

export function BulkActionsDropdown({ selectedIds, isArchived, onComplete }: BulkActionsDropdownProps) {
  const [loading, setLoading] = useState(false)

  const handleBulkArchive = async () => {
    try {
      setLoading(true)
      await bulkArchiveInvitations(selectedIds)
      onComplete()
    } catch (error) {
      console.error('Error bulk archiving:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className="bg-teal-600 hover:bg-[#114B5F] text-white"
          disabled={loading}
        >
          Bulk Actions ({selectedIds.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!isArchived && (
          <>
            <DropdownMenuItem onClick={handleBulkArchive}>
              Archive Selected
            </DropdownMenuItem>
          </>
        )}
        {isArchived && (
          <DropdownMenuItem>
            Restore Selected
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
