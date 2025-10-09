'use client'

import React, { useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Checkbox } from './checkbox'
import { Button } from './button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover'

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
  filters: Record<string, string[]>
  onFilterChange: (column: string, values: string[]) => void
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
          className="pl-10 h-11 placeholder:text-gray-500"
          title="Search dynamically filters results as you type"
        />
      </div>

      {/* Sort and Filter Controls */}
      <div className="flex gap-4">
        {/* Sort Dropdown - Always First */}
        {sortableColumns.length > 0 && (
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-auto min-w-48 h-11">
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

        {/* Filter Popovers with Checkboxes */}
        {filterableColumns.map((column: Column) => {
          const selectedFilters = filters[column.key] || []
          const selectedCount = selectedFilters.length
          const displayLabel = column.label
          
          return (
            <Popover key={column.key}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-auto min-w-40 h-11 justify-between font-normal"
                >
                  <span>
                    {selectedCount > 0 
                      ? `${displayLabel} (${selectedCount})` 
                      : displayLabel
                    }
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-base">Filter by {displayLabel}</h4>
                    {selectedCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-gray-500 hover:text-[#0694A2] hover:bg-transparent"
                        onClick={() => onFilterChange(column.key, [])}
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {column.filterOptions?.map((option: string) => {
                      const isChecked = selectedFilters.includes(option)
                      return (
                        <div key={option} className="flex items-center space-x-3">
                          <Checkbox
                            id={`${column.key}-${option}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onFilterChange(column.key, [...selectedFilters, option])
                              } else {
                                onFilterChange(column.key, selectedFilters.filter(v => v !== option))
                              }
                            }}
                            className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                          />
                          <label
                            htmlFor={`${column.key}-${option}`}
                            className="text-sm font-normal cursor-pointer leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                          >
                            {option}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )
        })}
      </div>
    </div>
  )
}
