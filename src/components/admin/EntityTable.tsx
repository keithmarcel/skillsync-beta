'use client'

import { useState } from 'react'
import DataTable from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Eye, Archive, Trash2, Star, StarOff } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export interface EntityColumn {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

export interface EntityAction {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  href?: string | ((row: any) => string)
  onClick?: (row: any) => void
  variant?: 'default' | 'destructive'
  requiresConfirmation?: boolean
  requiredRole?: 'super_admin' | 'company_admin' | 'provider_admin'
}

interface EntityTableProps {
  data: any[]
  columns: EntityColumn[]
  actions?: EntityAction[]
  loading?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  entityType: 'companies' | 'roles' | 'occupations' | 'providers' | 'programs' | 'assessments'
}

export function EntityTable({
  data,
  columns,
  actions = [],
  loading = false,
  searchPlaceholder = 'Search...',
  onSearch,
  onSort,
  entityType
}: EntityTableProps) {
  const { isSuperAdmin, isCompanyAdmin, isProviderAdmin } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter actions based on user role
  const filteredActions = actions.filter(action => {
    if (!action.requiredRole) return true
    
    if (action.requiredRole === 'super_admin') return isSuperAdmin
    if (action.requiredRole === 'company_admin') return isCompanyAdmin || isSuperAdmin
    if (action.requiredRole === 'provider_admin') return isProviderAdmin || isSuperAdmin
    
    return false
  })

  // Default actions for all entities
  const defaultActions: EntityAction[] = [
    {
      label: 'View Details',
      icon: Eye,
      href: (row: any) => `/admin/${entityType}/${row.id}`
    },
    {
      label: 'Edit',
      icon: Edit,
      href: (row: any) => `/admin/${entityType}/${row.id}/edit`
    }
  ]

  // Add status-specific actions
  const statusActions: EntityAction[] = []
  
  if (entityType === 'roles' || entityType === 'programs') {
    statusActions.push({
      label: 'Archive',
      icon: Archive,
      onClick: (row: any) => handleStatusChange(row.id, 'archived'),
      variant: 'destructive',
      requiresConfirmation: true
    })
  }

  // Add feature toggle for super admin
  if (isSuperAdmin) {
    statusActions.push({
      label: 'Toggle Featured',
      icon: Star,
      onClick: (row: any) => handleFeatureToggle(row.id, !row.is_featured),
      requiredRole: 'super_admin'
    })
  }

  const allActions = [...defaultActions, ...filteredActions, ...statusActions]

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const handleStatusChange = async (id: string, status: string) => {
    // TODO: Implement status change API call
    console.log(`Changing ${entityType} ${id} status to ${status}`)
  }

  const handleFeatureToggle = async (id: string, featured: boolean) => {
    // TODO: Implement feature toggle API call
    console.log(`Setting ${entityType} ${id} featured to ${featured}`)
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      published: 'default',
      archived: 'destructive'
    }
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Render featured badge
  const renderFeaturedBadge = (isFeatured: boolean) => {
    if (!isFeatured) return null
    
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Star className="w-3 h-3 mr-1" />
        Featured
      </Badge>
    )
  }

  // Enhanced columns with default renderers
  const enhancedColumns = columns.map(column => ({
    ...column,
    render: column.render || ((value: any, row: any) => {
      // Default renderers for common column types
      if (column.key === 'status') {
        return renderStatusBadge(value)
      }
      
      if (column.key === 'is_featured' || column.key === 'featured') {
        return renderFeaturedBadge(value)
      }
      
      if (column.key === 'created_at' || column.key === 'updated_at') {
        return new Date(value).toLocaleDateString()
      }
      
      return value
    })
  }))

  // Actions column
  const actionsColumn = {
    key: 'actions',
    label: '',
    render: (value: any, row: any) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {allActions.map((action, index) => {
            const Icon = action.icon
            const isDestructive = action.variant === 'destructive'
            
            if (action.href) {
              const href = typeof action.href === 'function' ? action.href(row) : action.href
              
              return (
                <DropdownMenuItem key={index} asChild>
                  <Link href={href} className={isDestructive ? 'text-red-600' : ''}>
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {action.label}
                  </Link>
                </DropdownMenuItem>
              )
            }
            
            return (
              <DropdownMenuItem
                key={index}
                onClick={() => action.onClick?.(row)}
                className={isDestructive ? 'text-red-600' : ''}
              >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DataTable
      data={data}
      columns={[...enhancedColumns, actionsColumn]}
      isLoading={loading}
      showSearchSortFilter={false}
    />
  )
}
