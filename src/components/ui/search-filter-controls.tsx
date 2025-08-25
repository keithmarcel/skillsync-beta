'use client'

import React from 'react'
import { Search } from 'lucide-react'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

interface Column {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  filterOptions?: string[]
}

interface SearchFilterControlsProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (value: string) => void
  filters: Record<string, string>
  onFilterChange: (column: string, value: string) => void
  columns: Column[]
  className?: string
}

export default function SearchFilterControls({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  sortBy,
  sortOrder,
  onSortChange,
  filters,
  onFilterChange,
  columns,
  className = ""
}: SearchFilterControlsProps) {
  // Get sortable columns
  const sortableColumns = columns.filter((col: Column) => col.sortable)
  
  // Get filterable columns
  const filterableColumns = columns.filter((col: Column) => col.filterable)

  return (
    <div className={`w-full flex items-center justify-between gap-4 ${className}`}>
      {/* Search */}
      <div className="relative w-full max-w-[420px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10"
          title="Search dynamically filters results as you type"
        />
      </div>

      {/* Sort and Filter Controls */}
      <div className="flex gap-4">
        {/* Sort Dropdown - Always First */}
        {sortableColumns.length > 0 && (
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-auto min-w-48 h-10">
              <SelectValue placeholder="Sort by...">
                {sortBy ? `Sort by ${sortableColumns.find(col => col.key === sortBy)?.label}${sortOrder === 'desc' ? ' ↓' : ' ↑'}` : 'Sort by...'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sortableColumns.map((column: Column) => (
                <SelectItem key={column.key} value={column.key}>
                  {column.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Filter Dropdowns */}
        {filterableColumns.map((column: Column) => (
          <Select 
            key={column.key}
            value={filters[column.key] || 'all'} 
            onValueChange={(value) => onFilterChange(column.key, value)}
          >
            <SelectTrigger className="w-auto min-w-40 h-10">
              <SelectValue placeholder={column.label}>
                {filters[column.key] ? `${column.label}: ${filters[column.key]}` : column.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {column.label}</SelectItem>
              {column.filterOptions?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  )
}
