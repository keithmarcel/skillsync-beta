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
  tableType?: 'programs' | 'jobs' | 'assessments' | 'occupations' | 'employer-invites' | 'employer-roles'
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
          // Special handling for proficiency_pct (Role Readiness) in employer-invites
          if (tableType === 'employer-invites' && column === 'proficiency_pct') {
            const proficiency = item.proficiency_pct
            const requiredProficiency = item.job?.required_proficiency_pct || 90 // Default to 90 if not set
            
            if (value.toLowerCase() === 'ready') {
              // Ready = meets or exceeds required proficiency
              return proficiency >= requiredProficiency
            } else if (value.toLowerCase() === 'almost there') {
              // Almost There = below required proficiency
              return proficiency < requiredProficiency
            }
            return false
          }
          
          // Status filter mapping for employer-invites
          if (tableType === 'employer-invites' && column === 'status') {
            const status = item.status?.toLowerCase()
            const filterValue = value.toLowerCase()
            
            // Map "Position Filled" to "unqualified" status
            if (filterValue === 'position filled') {
              return status === 'unqualified'
            }
            // Map "Pending" to both "sent" and "pending"
            if (filterValue === 'pending') {
              return status === 'sent' || status === 'pending'
            }
            return status === filterValue
          }
          
          // Default filter behavior
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
      case 'employer-invites': return 'View Candidate'
      default: return 'View Details'
    }
  }

  const getSearchPlaceholder = (type: string) => {
    switch (type) {
      case 'programs': return 'Search programs by name, school, or category'
      case 'jobs': return 'Search jobs by title, company, or category'
      case 'employer-invites': return 'Search by company, role, or status'
      case 'occupations': return 'Search occupations by title or category'
      default: return 'Search...'
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
              placeholder={getSearchPlaceholder(tableType)}
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
      <div className={`w-full max-w-[1232px] rounded-xl border border-[#E5E5E5] bg-[#FCFCFC] p-2 overflow-x-auto ${
        tableType === 'employer-invites' ? 'employer-invites-table' : ''
      }`}>
        {/* Mobile Card Layout (hidden by default, shown on mobile via CSS) */}
        {tableType === 'employer-invites' && (
          <div className="employer-invites-mobile-cards hidden space-y-4">
            {paginatedData.map((row: any, rowIndex: number) => (
              <div key={rowIndex} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                {/* Name with avatar */}
                <div className="flex items-center gap-3">
                  {columns[0]?.render ? columns[0].render(columns[0].key.split('.').reduce((obj, key) => obj?.[key], row), row, isOnFavoritesTab, onRowAction) : null}
                </div>
                
                {/* Role */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Role</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {columns[1]?.render ? columns[1].render(columns[1].key.split('.').reduce((obj, key) => obj?.[key], row), row, isOnFavoritesTab, onRowAction) : columns[1].key.split('.').reduce((obj, key) => obj?.[key], row)}
                  </div>
                </div>

                {/* Role Readiness */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Role Readiness</div>
                  <div>
                    {columns[2]?.render ? columns[2].render(columns[2].key.split('.').reduce((obj, key) => obj?.[key], row), row, isOnFavoritesTab, onRowAction) : null}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</div>
                  <div>
                    {columns[3]?.render ? columns[3].render(columns[3].key.split('.').reduce((obj, key) => obj?.[key], row), row, isOnFavoritesTab, onRowAction) : null}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  {columns[4]?.render ? columns[4].render(columns[4].key.split('.').reduce((obj, key) => obj?.[key], row), row, isOnFavoritesTab, onRowAction) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop Table */}
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          {/* Table Header */}
          <thead>
            <tr className="bg-[#F9FAFB] text-[#114B5F] text-xs font-semibold uppercase tracking-wide border-b border-[#E5E7EB]">
              {columns.map((column, index) => (
                <th 
                  key={column.key}
                  className={`py-6 text-left ${
                    index === columns.length - 1 ? 'text-center' : ''
                  } ${
                    tableType === 'employer-invites' && index >= 2 ? 'text-center' : ''
                  } ${
                    tableType === 'employer-invites' && index === 0 ? 'px-6 pr-8 sticky-col-left' : 'px-6'
                  } ${
                    tableType === 'employer-invites' && index === columns.length - 1 ? 'sticky-col-right' : ''
                  }`}
                  style={{
                    width: tableType === 'employer-invites' 
                      ? (index === 0 ? '23%' :  // Name
                         index === 1 ? '30%' :  // Role (more space for long titles)
                         index === 2 ? '17%' :  // Role Readiness (with proficiency)
                         index === 3 ? '20%' :  // Status
                         index === 4 ? '10%' : 'auto')  // Actions (more padding)
                      : tableType === 'employer-roles'
                      ? (index === 0 ? '40%' :  // Role Title (majority of space)
                         index === 1 ? '15%' :  // Category
                         index === 2 ? '12%' :  // Assessments
                         index === 3 ? '12%' :  // Candidates
                         index === 4 ? '12%' :  // Published
                         index === 5 ? '9%' : 'auto')  // Actions
                      : (index === 0 ? '22%' :
                         index === 1 ? '30%' :
                         index === 2 ? '12%' :
                         index === 3 ? '10%' :
                         index === 4 ? '12%' :
                         index === 5 ? '8%' : 'auto'),
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
                      className={`py-6 font-normal ${
                        colIndex === columns.length - 1 ? 'text-center' : ''
                      } ${
                        column.key === 'category' || column.key === 'readiness' ? 'whitespace-nowrap' : ''
                      } ${
                        tableType === 'employer-invites' && colIndex >= 2 ? 'text-center' : ''
                      } ${
                        tableType === 'employer-invites' && colIndex === 0 ? 'px-6 pr-8 sticky-col-left' : 'px-6'
                      } ${
                        tableType === 'employer-invites' && colIndex === 1 ? 'whitespace-nowrap' : ''
                      } ${
                        tableType === 'employer-invites' && colIndex === columns.length - 1 ? 'sticky-col-right' : ''
                      }`}
                      style={{
                        width: tableType === 'employer-invites'
                          ? (colIndex === 0 ? '23%' :
                             colIndex === 1 ? '30%' :
                             colIndex === 2 ? '17%' :
                             colIndex === 3 ? '20%' :
                             colIndex === 4 ? '10%' : 'auto')
                          : tableType === 'employer-roles'
                          ? (colIndex === 0 ? '40%' :  // Role Title (majority of space)
                             colIndex === 1 ? '15%' :  // Category
                             colIndex === 2 ? '12%' :  // Assessments
                             colIndex === 3 ? '12%' :  // Candidates
                             colIndex === 4 ? '12%' :  // Published
                             colIndex === 5 ? '9%' : 'auto')  // Actions
                          : (colIndex === 0 ? '22%' :
                             colIndex === 1 ? '30%' :
                             colIndex === 2 ? '12%' :
                             colIndex === 3 ? '10%' :
                             colIndex === 4 ? '12%' :
                             colIndex === 5 ? '8%' : 'auto'),
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
                        ) : tableType === 'employer-invites' && column.render ? (
                          // Employer invites - no link, just render
                          column.render(value, row, isOnFavoritesTab, onRowAction)
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
                        // Actions column - use custom render for employer-invites
                        tableType === 'employer-invites' && column.render ? (
                          column.render(value, row, isOnFavoritesTab, onRowAction)
                        ) : (
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
                        )
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
