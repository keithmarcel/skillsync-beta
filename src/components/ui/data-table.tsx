'use client'

import React, { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronDown, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TablePagination } from '@/components/ui/table-pagination'
import { PageLoader } from '@/components/ui/loading-spinner'

interface Column {
  key: string
  label: string
  width?: 'large' | 'medium' | 'small' | 'extra-small' | 'spacer'
  sortable?: boolean
  filterable?: boolean
  filterOptions?: string[]
  render?: (value: any, row: any, isOnFavoritesTab?: boolean, onRowAction?: (action: string, row: any) => void) => React.ReactNode
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  tableType?: 'programs' | 'jobs' | 'assessments' | 'occupations'
  isOnFavoritesTab?: boolean
  loadingText?: string
  onRowAction?: (action: string, row: any) => void
  showSearchSortFilter?: boolean
  isLoading?: boolean
  isFavorite?: (entityKind: 'job' | 'program', entityId: string) => boolean
}

export default function DataTable({
  data,
  columns,
  tableType = 'jobs',
  isOnFavoritesTab = false,
  loadingText,
  onRowAction,
  showSearchSortFilter = true,
  isFavorite,
  isLoading = false
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 30

  // Get sortable and filterable columns
  const sortableColumns = columns.filter(col => col.sortable)
  const filterableColumns = columns.filter(col => col.filterable)
  
  // Get searchable fields from columns
  const searchableFields = columns.filter(col => col.key !== 'actions').map(col => col.key)

  // Process data with search, sort, and filter
  const processedData = useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item: any) =>
        searchableFields.some((field: string) => {
          const value = field.split('.').reduce((obj: any, key: string) => obj?.[key], item)
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply column filters
    Object.entries(filters).forEach(([column, value]) => {
      if (value) {
        filtered = filtered.filter((item: any) => {
          const itemValue = column.split('.').reduce((obj, key) => obj?.[key], item)
          return itemValue?.toString().toLowerCase() === value.toLowerCase()
        })
      }
    })

    // Apply sorting
    if (sortBy) {
      filtered.sort((a: any, b: any) => {
        const aValue = sortBy.split('.').reduce((obj, key) => obj?.[key], a)
        const bValue = sortBy.split('.').reduce((obj, key) => obj?.[key], b)
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchTerm, sortBy, sortOrder, filters, searchableFields])

  // Pagination calculations
  const totalItems = processedData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = processedData.slice(startIndex, endIndex)
  const showPagination = totalItems > itemsPerPage

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
      case 'jobs': return 'View Job Details'
      case 'programs': return 'View Program Details'
      case 'occupations': return 'View Occupation Details'
      default: return 'View Details'
    }
  }

  const getSecondaryActionLabel = (type: string) => {
    switch (type) {
      case 'programs': return 'About the School'
      default: return null
    }
  }

  const getTertiaryActionLabel = (type: string) => {
    switch (type) {
      case 'programs': return 'See Related Jobs'
      default: return null
    }
  }

  return (
    <div className="space-y-5">
      {/* Search, Sort, and Filter Controls */}
      {showSearchSortFilter && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full max-w-[420px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search programs by name, school, or category"
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
                  <SelectValue placeholder={column.label} />
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
      <div className="w-full max-w-[1232px] rounded-xl border border-[#E5E5E5] bg-[#FCFCFC] p-2 overflow-x-auto">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          {/* Table Header */}
          <thead>
            <tr className="bg-[#F9FAFB] text-[#114B5F] text-xs font-semibold uppercase tracking-wide border-b border-[#E5E7EB]">
              {columns.map((column, index) => (
                <th 
                  key={column.key}
                  className={`py-6 px-6 text-left ${index === columns.length - 1 ? 'text-center' : ''}`}
                  style={{
                    width: index === 0 ? '22%' :
                           index === 1 ? '30%' :
                           index === 2 ? '12%' :
                           index === 3 ? '10%' :
                           index === 4 ? '12%' :
                           index === 5 ? '8%' : 'auto',
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {paginatedData.map((row: any, rowIndex: number) => (
              <tr key={rowIndex} className="text-[#0A0A0A] text-sm font-normal leading-5 border-b border-gray-100 hover:bg-gray-50 group">
                {columns.map((column, colIndex) => {
                  const value = column.key.split('.').reduce((obj, key) => obj?.[key], row)
                  
                  return (
                    <td 
                      key={column.key}
                      className={`py-6 px-6 font-normal ${colIndex === columns.length - 1 ? 'text-center' : ''} ${column.key === 'category' || column.key === 'readiness' ? 'whitespace-nowrap' : ''}`}
                      style={{
                        width: colIndex === 0 ? '22%' :
                               colIndex === 1 ? '30%' :
                               colIndex === 2 ? '12%' :
                               colIndex === 3 ? '10%' :
                               colIndex === 4 ? '12%' :
                               colIndex === 5 ? '8%' : 'auto',
                      }}
                    >
                      {colIndex === 0 ? (
                        tableType === 'programs' && column.render ? (
                          // Programs table with custom render (includes badge below title)
                          <div className="flex flex-col gap-1.5">
                            <Link 
                              href={`/${tableType}/${row.id}`}
                              className="text-inherit group-hover:text-[#0694A2] group-hover:underline transition-colors font-semibold text-base w-fit font-source-sans-pro"
                            >
                              {value}
                            </Link>
                            {column.render(value, row, isOnFavoritesTab, onRowAction)}
                          </div>
                        ) : (
                          // Jobs and other tables (render function handles everything)
                          <Link 
                            href={`/${tableType}/${row.id}`}
                            className="text-inherit group-hover:text-[#0694A2] group-hover:underline transition-colors font-semibold text-base w-fit font-source-sans-pro"
                          >
                            {column.render ? column.render(value, row, isOnFavoritesTab, onRowAction) : value}
                          </Link>
                        )
                      ) : colIndex === columns.length - 1 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 mx-auto">
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
                            {getTertiaryActionLabel(tableType) && (
                              <DropdownMenuItem onClick={() => onRowAction?.('tertiary', row)}>
                                {getTertiaryActionLabel(tableType)}
                              </DropdownMenuItem>
                            )}
                            {tableType === 'jobs' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onRowAction?.('resume', row)}>
                                  Upload Your Resume
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onRowAction?.('assessment', row)}>
                                  Take a Skills Assessment
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => {
                              const entityKind = tableType === 'programs' ? 'program' : 'job'
                              const action = isOnFavoritesTab ? 'unfavorite' : ((isFavorite && isFavorite(entityKind, row.id)) ? 'unfavorite' : 'favorite')
                              onRowAction?.(action, row)
                            }}>
                              {(() => {
                                const entityKind = tableType === 'programs' ? 'program' : 'job'
                                const isCurrentlyFavorited = isOnFavoritesTab || (isFavorite && isFavorite(entityKind, row.id))
                                return isCurrentlyFavorited ? 'Remove from Favorites' : 'Add to Favorites'
                              })()}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        column.render ? column.render(value, row, isOnFavoritesTab, onRowAction) : value
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading ? (
          <PageLoader text={loadingText || 'Loading'} />
        ) : processedData.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            No results found
          </div>
        ) : null}
      </div>
      {showPagination && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
      
    </div>
  )
}
