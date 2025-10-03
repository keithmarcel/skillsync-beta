'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface InvitationFiltersProps {
  readinessFilter: string
  statusFilter: string
  onReadinessChange: (value: string) => void
  onStatusChange: (value: string) => void
  isArchived: boolean
}

export function InvitationFilters({
  readinessFilter,
  statusFilter,
  onReadinessChange,
  onStatusChange,
  isArchived
}: InvitationFiltersProps) {
  return (
    <div className="flex gap-2">
      {/* Readiness Filter */}
      <Select value={readinessFilter} onValueChange={onReadinessChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Readiness" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">Readiness: All</SelectItem>
          <SelectItem value="Ready">Ready</SelectItem>
          <SelectItem value="Building Skills">Building Skills</SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter (only for active tab) */}
      {!isArchived && (
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Status: All</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Applied">Applied</SelectItem>
            <SelectItem value="Declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
