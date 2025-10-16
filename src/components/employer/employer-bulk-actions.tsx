'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface EmployerBulkActionsProps {
  selectedIds: string[]
  isArchived: boolean
  onComplete: () => void
}

export function EmployerBulkActions({ selectedIds, isArchived, onComplete }: EmployerBulkActionsProps) {
  const [loading, setLoading] = useState(false)

  const handleBulkAction = async (action: string) => {
    try {
      setLoading(true)
      // TODO: Implement bulk actions
      console.log(`Bulk ${action} for:`, selectedIds)
      onComplete()
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={loading}
          className="border-[#0694A2] text-[#0694A2] hover:bg-[#0694A2] hover:text-white"
        >
          Bulk Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {!isArchived && (
          <>
            <DropdownMenuItem onClick={() => handleBulkAction('send')}>
              Send Invitations
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleBulkAction('hired')}>
              Mark as Hired
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction('unqualified')}>
              Mark as Unqualified
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
          {isArchived ? 'Restore' : 'Archive'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
