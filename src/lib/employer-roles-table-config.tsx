import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { renderCategoryBadge } from '@/lib/table-configs'

// Helper to render published status with Switch
const renderPublishedSwitch = (isPublished: boolean, row: any, onToggle?: (row: any, newValue: boolean) => void) => {
  return React.createElement('div', {
    className: 'flex items-center justify-center'
  }, React.createElement(Switch, {
    checked: isPublished,
    onCheckedChange: (checked: boolean) => onToggle?.(row, checked),
    className: 'data-[state=checked]:bg-cyan-800'
  }))
}

// Helper to render actions dropdown
const renderActionsDropdown = (value: any, row: any, isOnFavoritesTab?: boolean, onRowAction?: (action: string, row: any) => void) => {
  const menuItems = []
  
  // Edit Role
  menuItems.push(
    React.createElement(DropdownMenuItem, {
      key: 'edit',
      onClick: () => onRowAction?.('edit', row)
    }, 'Edit Role')
  )
  
  // View Candidates
  menuItems.push(
    React.createElement(DropdownMenuItem, {
      key: 'view-candidates',
      onClick: () => onRowAction?.('view-candidates', row)
    }, 'View Candidates')
  )
  
  menuItems.push(React.createElement(DropdownMenuSeparator, { key: 'sep1' }))
  
  // Duplicate Role
  menuItems.push(
    React.createElement(DropdownMenuItem, {
      key: 'duplicate',
      onClick: () => onRowAction?.('duplicate', row)
    }, 'Duplicate Role')
  )
  
  menuItems.push(React.createElement(DropdownMenuSeparator, { key: 'sep2' }))
  
  // Archive Role
  menuItems.push(
    React.createElement(DropdownMenuItem, {
      key: 'archive',
      onClick: () => onRowAction?.('archive', row),
      className: 'text-red-600'
    }, 'Archive Role')
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
    label: 'Role Title',
    sortable: true,
    width: 'large' as const,
    render: (value: string) => React.createElement('span', {
      className: 'text-base font-semibold text-gray-900 font-source-sans-pro'
    }, value)
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
    render: (value: boolean, row: any, isOnFavoritesTab?: boolean, onRowAction?: (action: string, row: any) => void) => {
      return renderPublishedSwitch(value, row, (row, newValue) => {
        onRowAction?.('toggle-publish', { ...row, newPublishState: newValue })
      })
    }
  },
  {
    key: 'actions',
    label: 'Actions',
    width: 'small' as const,
    render: (value: any, row: any, isOnFavoritesTab?: boolean, onRowAction?: (action: string, row: any) => void) => renderActionsDropdown(value, row, isOnFavoritesTab, onRowAction)
  }
]
