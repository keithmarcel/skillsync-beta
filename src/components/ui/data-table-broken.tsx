'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Search, MoreHorizontal } from 'lucide-react'

// Badge color mapping from Figma design
const categoryColors = {
  'Health & Education': { bg: '#F6F5FF', text: '#1E429F' },
  'Logistics': { bg: '#EDFAFA', text: '#014451' },
  'Hospitality': { bg: '#FCE8F3', text: '#633112' },
  'Finance & Legal': { bg: '#E5EDFF', text: '#42389D' },
  'Public Services': { bg: '#FFF8F1', text: '#8A2C0D' },
  'Tech & Services': { bg: '#EDEBFE', text: '#5521B5' },
  'Skilled Trades': { bg: '#FCE8F3', text: '#99154B' },
  'Business': { bg: '#E1EFFE', text: '#1E429F' },
}

const readinessColors = {
  'ready': { bg: '#84E1BC', text: '#374151' },
  'close gaps': { bg: '#FDBA8C', text: '#374151' },
  'assess skills': { bg: '#F3F4F6', text: '#374151' },
}

interface Column {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  filterOptions?: string[]
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  searchPlaceholder?: string
  searchableFields?: string[]
  tableType?: 'jobs' | 'programs' | 'occupations'
  isOnFavoritesTab?: boolean
  onRowAction?: (action: string, row: any) => void
  showSearchSortFilter?: boolean
}

export default function DataTable({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchableFields = [],
  tableType = 'jobs',
  isOnFavoritesTab = false,
  onRowAction,
  showSearchSortFilter = true
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Get sortable columns
  const sortableColumns = columns.filter(col => col.sortable)
  
  // Get filterable columns
  const filterableColumns = columns.filter(col => col.filterable)

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row => {
        return searchableFields.some(field => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], row)
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })
      })
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(row => {
          const rowValue = key.split('.').reduce((obj, key) => obj?.[key], row)
          return rowValue === value
        })
      }
    })

    // Apply sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = sortBy.split('.').reduce((obj, key) => obj?.[key], a)
        const bValue = sortBy.split('.').reduce((obj, key) => obj?.[key], b)
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchTerm, searchableFields, filters, sortBy, sortOrder])

  const handleSort = (value: string) => {
    if (sortBy === value) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(value)
      setSortOrder('asc')
    }
  }

  const handleFilter = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value === 'all' ? '' : value
    }))
  }

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'jobs':
        return 'Role Details'
      case 'programs':
        return 'Program Details'
      case 'occupations':
        return 'Occupation Details'
      default:
        return 'Details'
    }
  }

  const getSecondaryActionLabel = (type: string) => {
    switch (type) {
      case 'jobs':
        return 'About the Company'
      case 'programs':
        return 'About the School'
      default:
        return null
    }
  }

  const renderBadge = (value: string, type: 'category' | 'readiness') => {
    const colors = type === 'category' ? categoryColors : readinessColors
    const color = (colors as any)[value] || { bg: '#F3F4F6', text: '#111928' }
    
    // Convert to title case for display
    const displayValue = value.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
    
    return (
      <Badge 
        style={{ 
          backgroundColor: color.bg, 
          color: color.text,
          borderRadius: '10px',
          boxShadow: 'none'
        }}
        className="font-medium border-0"
      >
        {displayValue}
      </Badge>
    )
  }

  return (
    <div className="space-y-5">
      {/* Search, Sort, and Filter Controls - only show if showSearchSortFilter is true */}
      {showSearchSortFilter && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort and Filter Controls */}
          <div className="flex gap-4">
            {/* Sort Dropdown */}
            {sortableColumns.length > 0 && (
              <Select value={sortBy} onValueChange={handleSort}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {sortableColumns.map((column) => (
                    <SelectItem key={column.key} value={column.key}>
                      {column.label} {sortBy === column.key && (sortOrder === 'asc' ? '↑' : '↓')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Filter Dropdowns */}
            {filterableColumns.map((column) => (
              <Select 
                key={column.key} 
                value={filters[column.key] || ''} 
                onValueChange={(value) => handleFilter(column.key, value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={`Filter ${column.label}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {column.label}</SelectItem>
                  {column.filterOptions?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="w-full max-w-[1232px] rounded-xl border border-[#E5E5E5] bg-[#FCFCFC]">
        {/* Table Header */}
        <div className="flex items-center self-stretch px-6 py-4 bg-[#F9FAFB] text-[#114B5F] text-xs font-semibold uppercase tracking-wide rounded-t-xl">
          {columns.map((column, index) => (
            <div 
              key={column.key}
              className={`flex-1 ${index === columns.length - 1 ? 'text-right' : ''}`}
            >
              {column.label}
            </div>
          ))}
        </div>

        {/* Table Rows */}
        {processedData.map((row: any, rowIndex: number) => (
          <div 
            key={rowIndex}
            className="flex items-center self-stretch px-6 py-6 text-[#0A0A0A] text-sm font-normal leading-5 border-b border-gray-100 hover:bg-gray-50 group"
          >
            {columns.map((column, colIndex) => {
              const value = column.key.split('.').reduce((obj, key) => obj?.[key], row)
              
              return (
                <div 
                  key={column.key}
                  className={`flex-1 font-normal ${colIndex === columns.length - 1 ? 'flex justify-end' : ''}`}
                >
                  {colIndex === 0 ? (
                    // First column should be a link
                    <Link 
                      href={`/${tableType}/${row.id}`}
                      className="text-inherit hover:text-[#0694A2] transition-colors font-normal"
                    >
                      {column.render ? column.render(value, row) : value}
                    </Link>
                  ) : colIndex === columns.length - 1 ? (
                    // Last column is actions dropdown
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRowAction?.('details', row)}>
                          {getActionLabel(tableType)}
                        </DropdownMenuItem>
                        {getSecondaryActionLabel(tableType) && (
                          <DropdownMenuItem onClick={() => onRowAction?.('secondary', row)}>
                            {getSecondaryActionLabel(tableType)}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {(tableType === 'occupations' || tableType === 'jobs') && (
                          <>
                            <DropdownMenuItem onClick={() => onRowAction?.('resume', row)}>
                              Upload Your Resume
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onRowAction?.('assessment', row)}>
                              Take a Skills Assessment
                            </DropdownMenuItem>
                          </>
                        )}
                        {tableType === 'programs' && (
                          <DropdownMenuItem onClick={() => onRowAction?.('jobs', row)}>
                            See Jobs for This Program
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onRowAction?.(isOnFavoritesTab ? 'unfavorite' : 'favorite', row)}>
                          {isOnFavoritesTab ? 'Remove from Favorites' : 'Add to Favorites'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    // Regular column content
                    column.render ? column.render(value, row) : value
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {processedData.length === 0 && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            No results found
          </div>
        )}
      </div>
    </div>
  )
}

// Export helper function for badge rendering
export { categoryColors, readinessColors }
