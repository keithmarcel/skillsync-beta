'use client'

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Filter, ArrowUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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
}: AdminTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ key: '', direction: null });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

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
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9"
            value={filters.global || ''}
            onChange={(e) => handleFilterChange('global', e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
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
                <SelectTrigger className="h-8 w-[70px]">
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

      {/* Column filters */}
      {showFilters && (
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
                    value={filters[column.key] || ''}
                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const isSorted = sortConfig.key === column.key;
                const isSortable = column.sortable !== false;
                
                return (
                  <TableHead 
                    key={column.key}
                    className={column.className}
                    style={{ width: column.width }}
                  >
                    {isSortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 hover:bg-transparent"
                        onClick={() => handleSort(column.key)}
                      >
                        {column.header}
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${
                          isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                        }`} />
                        {isSorted && (
                          <span className="sr-only">
                            {sortConfig.direction === 'asc' ? 'Sorted ascending' : 'Sorted descending'}
                          </span>
                        )}
                      </Button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
              {(rowActions || actions) && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow 
                key={row[keyField]} 
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render 
                      ? column.render(row[column.key], row) 
                      : String(row[column.key] ?? '—')
                    }
                  </TableCell>
                ))}
                {(rowActions || actions) && (
                  <TableCell>
                    <div className="flex justify-end space-x-1">
                      {rowActions && rowActions(row).map((action, index) => (
                        <React.Fragment key={index}>
                          {action}
                        </React.Fragment>
                      ))}
                      {actions && actions.map((action, index) => (
                        <React.Fragment key={index}>
                          {action.href ? (
                            <a 
                              href={action.href(row)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {action.label}
                            </a>
                          ) : (
                            <button
                              onClick={() => action.onClick?.(row)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {action.label}
                            </button>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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
