import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { renderCategoryBadge } from '@/lib/table-configs'

// Helper to render published status
const renderPublishedStatus = (isPublished: boolean) => {
  return React.createElement('div', {
    className: 'flex items-center justify-center'
  }, isPublished ? React.createElement(Check, { className: 'w-4 h-4 text-green-600' }) : null)
}

// Helper to render actions dropdown
const renderActionsDropdown = (value: any, row: any, isOnFavoritesTab?: boolean, onRowAction?: (action: string, row: any) => void) => {
  const menuItems = []
  
  // View Details
  menuItems.push(
    React.createElement(DropdownMenuItem, {
      key: 'view',
      onClick: () => onRowAction?.('view-details', row)
    }, 'View Details')
  )
  
  // Edit Role
  menuItems.push(
    React.createElement(DropdownMenuItem, {
      key: 'edit',
      onClick: () => onRowAction?.('edit', row)
    }, 'Edit Role')
  )
  
  menuItems.push(React.createElement(DropdownMenuSeparator, { key: 'sep1' }))
  
  // Publish/Unpublish
  if (row.is_published) {
    menuItems.push(
      React.createElement(DropdownMenuItem, {
        key: 'unpublish',
        onClick: () => onRowAction?.('unpublish', row)
      }, 'Unpublish Role')
    )
  } else {
    menuItems.push(
      React.createElement(DropdownMenuItem, {
        key: 'publish',
        onClick: () => onRowAction?.('publish', row)
      }, 'Publish Role')
    )
  }
  
  menuItems.push(React.createElement(DropdownMenuSeparator, { key: 'sep2' }))
  
  // Delete
  menuItems.push(
    React.createElement(DropdownMenuItem, {
      key: 'delete',
      onClick: () => onRowAction?.('delete', row),
      className: 'text-red-600'
    }, 'Delete Role')
  )
  
  return React.createElement(DropdownMenu, {}, [
    React.createElement(DropdownMenuTrigger, {
      key: 'trigger',
      asChild: true
    }, React.createElement(Button, {
      variant: 'ghost',
      className: 'h-8 w-8 p-0'
    }, React.createElement(MoreHorizontal, { className: 'h-4 w-4' }))),
    React.createElement(DropdownMenuContent, {
      key: 'content',
      align: 'end',
      className: 'w-48'
    }, menuItems)
  ])
}

// Employer roles table columns
export const employerRolesTableColumns = [
  {
    key: 'title',
    label: 'Role',
    sortable: true,
    width: 'large' as const,
    render: (value: string) => React.createElement('span', {
      className: 'text-base font-semibold text-gray-900 font-source-sans-pro'
    }, value)
  },
  {
    key: 'short_desc',
    label: 'Summary',
    width: 'large' as const,
    render: (value: string) => React.createElement('span', {
      className: 'text-sm text-gray-600 line-clamp-2'
    }, value || 'No description')
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    filterable: true,
    filterOptions: ['Business', 'Health & Education', 'Tech & Services', 'Finance & Legal', 'Skilled Trades', 'Logistics', 'Hospitality', 'Public Services'],
    width: 'small' as const,
    render: (value: string) => value ? renderCategoryBadge(value) : React.createElement(Badge, {
      style: { 
        backgroundColor: '#F3F4F6', 
        color: '#374151',
        borderRadius: '10px',
        boxShadow: 'none'
      },
      className: 'font-medium border-0'
    }, 'N/A')
  },
  {
    key: 'required_proficiency_pct',
    label: 'Required Proficiency',
    sortable: true,
    width: 'small' as const,
    render: (value: number) => React.createElement('span', {
      className: 'text-sm text-gray-900'
    }, `${value || 90}%`)
  },
  {
    key: 'assessments_count',
    label: 'Assessments',
    sortable: true,
    width: 'small' as const,
    render: (value: number) => React.createElement('span', {
      className: 'text-sm text-gray-900'
    }, `${value || 0}`)
  },
  {
    key: 'is_published',
    label: 'Published',
    filterable: true,
    filterOptions: ['Published', 'Unpublished'],
    width: 'small' as const,
    render: (value: boolean) => renderPublishedStatus(value)
  },
  {
    key: 'actions',
    label: 'Actions',
    width: 'small' as const,
    render: (value: any, row: any, isOnFavoritesTab?: boolean, onRowAction?: (action: string, row: any) => void) => renderActionsDropdown(value, row, isOnFavoritesTab, onRowAction)
  }
]
