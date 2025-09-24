'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Filter, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationDialog } from './ConfirmationDialog';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortDirection = 'asc' | 'desc' | null;

interface AdminTableProps<T> {
  data: T[];
  columns: {
    key: string;
    header: string;
    render?: (value: any, row: T) => React.ReactNode;
    sortable?: boolean;
    filterable?: boolean;
    width?: string | number;
    className?: string;
  }[];
  actions?: {
    label: string;
    href?: (row: T) => string;
    onClick?: (row: T) => void;
    isDestructive?: boolean;
  }[];
  keyField?: string;
  loading?: boolean;
  error?: string | null;
  onRowClick?: (row: T) => void;
  onSort?: (key: string, direction: SortDirection) => void;
  onFilter?: (filters: Record<string, string>) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  rowActions?: (row: T) => React.ReactNode[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  // Bulk operations
  bulkActions?: {
    label: string;
    onClick: (selectedIds: string[]) => void;
    isDestructive?: boolean;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  }[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function AdminTable<T extends Record<string, any>>({
  data = [],
  columns,
  actions,
  keyField = 'id',
  loading = false,
  error = null,
  onRowClick,
  onSort,
  onFilter,
  pagination,
  rowActions,
  searchPlaceholder = "Search...",
  emptyMessage = "No data available",
  className = '',
  bulkActions,
  onSelectionChange,
}: AdminTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ key: '', direction: null });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; onConfirm?: () => void }>({ isOpen: false });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
      onSelectionChange?.([]);
    } else {
      const allIds = paginatedData.map((row: T) => String(row[keyField]));
      setSelectedRows(new Set(allIds));
      setSelectAll(true);
      onSelectionChange?.(allIds);
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(id)) {
      newSelectedRows.delete(id);
    } else {
      newSelectedRows.add(id);
    }
    setSelectedRows(newSelectedRows);
    setSelectAll(newSelectedRows.size === paginatedData.length);
    onSelectionChange?.(Array.from(newSelectedRows));
  };

  // Clear selection when data changes
  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
    onSelectionChange?.([]);
  }, [data, pagination?.page, pagination?.pageSize, onSelectionChange]);

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      } else {
        direction = 'asc';
      }
    }
    
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    
    if (onSort) {
      onSort(key, direction);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  // Apply local filtering
  const filteredData = useMemo(() => {
    if (onFilter) {
      // If onFilter is provided, the parent handles filtering
      return data;
    }
    
    return data.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = row[key]?.toString().toLowerCase() || '';
        return cellValue.includes(value.toLowerCase());
      });
    });
  }, [data, filters, onFilter]);

  // Apply local sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction || onSort) {
      // If onSort is provided, the parent handles sorting
      return filteredData;
    }
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === bValue) return 0;
      
      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });
  }, [filteredData, sortConfig, onSort]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const { page, pageSize } = pagination;
    const startIndex = (page - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, pagination]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
                {rowActions && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-3/4" />
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-medium">Error loading data</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Empty state
  if (filteredData.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and filter bar */}
      {searchPlaceholder && (
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              value={filters.global || ''}
              onChange={(e) => handleFilterChange('global', e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
            
            {pagination?.onPageSizeChange && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={(value) => pagination.onPageSizeChange(Number(value))}
                >
                  <SelectTrigger className="w-[70px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <SelectValue placeholder={pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Column filters */}
      {showFilters && searchPlaceholder && (
        <div className="rounded-md border p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {columns
              .filter((column) => column.filterable)
              .map((column) => (
                <div key={column.key}>
                  <label className="mb-1 block text-sm font-medium">
                    Filter by {column.header}
                  </label>
                  <Input
                    placeholder={`Filter ${column.header.toLowerCase()}...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    value={filters[column.key] || ''}
                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {bulkActions && selectedRows.size > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-teal-800">
                {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRows(new Set());
                  setSelectAll(false);
                  onSelectionChange?.([]);
                }}
                className="text-teal-600 hover:text-teal-700"
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              {bulkActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  size="sm"
                  onClick={() => action.onClick(Array.from(selectedRows))}
                  className={action.isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="w-full rounded-xl border border-[#E5E5E5] bg-[#FCFCFC] p-2 overflow-x-auto">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          {/* Table Header */}
          <thead>
            <tr className="bg-[#F9FAFB] text-[#114B5F] text-xs font-semibold uppercase tracking-wide border-b border-[#E5E7EB]">
              {bulkActions && (
                <th className="py-6 px-4 w-[50px]">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th 
                  key={column.key}
                  className={`py-6 px-6 text-left ${index === columns.length - 1 ? 'text-center' : ''}`}
                  style={{ width: column.width }}
                >
                  {column.sortable !== false ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 hover:bg-transparent text-[#114B5F] font-semibold uppercase text-xs"
                      onClick={() => handleSort(column.key)}
                    >
                      {column.header}
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${
                        sortConfig.key === column.key ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                      }`} />
                    </Button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {(rowActions || actions) && <th className="py-6 px-6 text-center w-[100px]">Actions</th>}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {paginatedData.map((row) => (
              <tr 
                key={row[keyField]} 
                className={`text-[#0A0A0A] text-sm font-normal leading-5 border-b border-gray-100 hover:bg-gray-50 group ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {bulkActions && (
                  <td className="py-6 px-4">
                    <Checkbox
                      checked={selectedRows.has(String(row[keyField]))}
                      onCheckedChange={() => handleSelectRow(String(row[keyField]))}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((column, colIndex) => (
                  <td 
                    key={column.key} 
                    className={`py-6 px-6 font-normal ${colIndex === columns.length - 1 ? 'text-center' : ''} ${column.className || ''}`}
                  >
                    {column.render 
                      ? column.render(row[column.key], row) 
                      : String(row[column.key] ?? '—')
                    }
                  </td>
                ))}
                {(rowActions || actions) && (
                  <td className="py-6 px-6 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 mx-auto">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {rowActions && rowActions(row).map((action, index) => (
                          <React.Fragment key={index}>
                            {action}
                          </React.Fragment>
                        ))}
                        {actions && actions.map((action, index) => {
                          const handleActionClick = () => {
                            if (action.isDestructive) {
                              setDialogState({
                                isOpen: true,
                                onConfirm: () => {
                                  action.onClick?.(row);
                                  setDialogState({ isOpen: false });
                                },
                              });
                            } else {
                              action.onClick?.(row);
                            }
                          };

                          return (
                            <DropdownMenuItem key={index} onClick={handleActionClick}>
                              {action.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <ConfirmationDialog
        isOpen={dialogState.isOpen}
        onOpenChange={(isOpen) => setDialogState({ ...dialogState, isOpen })}
        onConfirm={() => dialogState.onConfirm?.()}
        title="Are you sure?"
        description="This action cannot be undone."
      />

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing{' '}
            <span className="font-medium">
              {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span> results
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(1)}
                disabled={pagination.page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
                <span className="sr-only">First page</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page * pagination.pageSize >= pagination.total}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(Math.ceil(pagination.total / pagination.pageSize))}
                disabled={pagination.page * pagination.pageSize >= pagination.total}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
                <span className="sr-only">Last page</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
