import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, MoreHorizontal, ExternalLink } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Helper to render company logo with name
export const renderCompanyLogo = (value: string, row: any) => {
  const company = row.company
  if (!company) return value

  return React.createElement('div', { className: 'flex items-center gap-3' }, [
    // Logo
    company.logo_url 
      ? React.createElement('img', {
          key: 'logo',
          src: company.logo_url,
          alt: company.name || '',
          className: 'w-24 h-24 object-contain flex-shrink-0'
        })
      : React.createElement('div', {
          key: 'logo',
          className: 'w-24 h-24 rounded bg-gray-200 flex items-center justify-center flex-shrink-0'
        }, React.createElement('span', {
          className: 'text-gray-600 font-medium text-lg'
        }, company.name?.substring(0, 2).toUpperCase() || '??'))
  ])
}

// Helper to render job seeker role readiness badge (combined with proficiency)
export const renderJobSeekerReadinessBadge = (proficiency: number) => {
  if (proficiency >= 90) {
    return React.createElement('span', {
      className: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800'
    }, [
      React.createElement('span', { key: 'label' }, 'Ready'),
      React.createElement('span', { key: 'divider', className: 'text-green-600' }, '|'),
      React.createElement('span', { key: 'pct', className: 'font-semibold' }, `${proficiency}%`)
    ])
  } else if (proficiency >= 85) {
    return React.createElement('span', {
      className: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800'
    }, [
      React.createElement('span', { key: 'label' }, 'Almost There'),
      React.createElement('span', { key: 'divider', className: 'text-orange-600' }, '|'),
      React.createElement('span', { key: 'pct', className: 'font-semibold' }, `${proficiency}%`)
    ])
  }
  // Below 85% - show proficiency only
  return React.createElement('span', {
    className: 'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700'
  }, `${proficiency}%`)
}

// Helper to render job seeker status badge or button
export const renderJobSeekerStatus = (status: string, row: any, isOnFavoritesTab?: boolean, onRowAction?: (action: string, row: any) => void) => {
  // If archived, show the status before archive (or 'archived' if no previous status)
  const displayStatus = status === 'archived' 
    ? (row.status_before_archive || 'archived')
    : status
  
  // For pending/sent status, show View Application button (but not if archived)
  if ((displayStatus === 'sent' || displayStatus === 'pending') && status !== 'archived') {
    return React.createElement(Button, {
      size: 'sm',
      onClick: () => onRowAction?.('view-application', row),
      className: 'bg-teal-600 hover:bg-[#114B5F] text-white min-w-[120px]'
    }, 'View Application')
  }

  const statusConfig: Record<string, { bg: string, text: string, label: string, icon?: any }> = {
    sent: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'Pending' },
    applied: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Applied', icon: Check },
    declined: { bg: 'bg-red-100', text: 'text-red-800', label: 'Declined', icon: X },
    hired: { bg: 'bg-green-100', text: 'text-green-800', label: 'Hired', icon: Check },
    unqualified: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Position Filled' },
    archived: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'Archived' }
  }

  const config = statusConfig[displayStatus]
  if (!config) return null

  const children = config.icon
    ? [
        React.createElement(config.icon, { key: 'icon', className: 'w-3.5 h-3.5' }),
        config.label
      ]
    : config.label

  return React.createElement('span', {
    className: `inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium ${config.bg} ${config.text} border border-${config.text.replace('text-', '')} min-w-[120px]`
  }, children)
}

// Helper to render job seeker actions dropdown
export const renderJobSeekerActions = (value: any, row: any, isOnFavoritesTab?: boolean, onRowAction?: (action: string, row: any) => void) => {
  const menuItems = []
  const isArchived = row.status === 'archived'
  const isRoleDeleted = !row.job
  
  if (isArchived) {
    // Archived actions
    menuItems.push(
      React.createElement(DropdownMenuItem, {
        key: 'restore',
        onClick: () => onRowAction?.('restore', row)
      }, 'Restore Invite')
    )
    // Only show View Role Details if role still exists
    if (!isRoleDeleted) {
      menuItems.push(
        React.createElement(DropdownMenuItem, {
          key: 'role-details',
          onClick: () => onRowAction?.('view-role', row)
        }, 'View Role Details')
      )
    }
    menuItems.push(
      React.createElement(DropdownMenuItem, {
        key: 'assessment',
        onClick: () => onRowAction?.('view-assessment', row)
      }, 'View Assessment')
    )
  } else {
    // Active actions - only show View Application for sent/pending status
    if (row.status === 'sent' || row.status === 'pending') {
      menuItems.push(
        React.createElement(DropdownMenuItem, {
          key: 'view-app',
          onClick: () => onRowAction?.('view-application', row)
        }, [
          React.createElement(ExternalLink, { key: 'icon', className: 'w-4 h-4 mr-2' }),
          'View Application'
        ])
      )
      menuItems.push(
        React.createElement(DropdownMenuSeparator, { key: 'sep1' })
      )
      menuItems.push(
        React.createElement(DropdownMenuItem, {
          key: 'applied',
          onClick: () => onRowAction?.('mark-applied', row)
        }, 'Mark as Applied')
      )
      menuItems.push(
        React.createElement(DropdownMenuItem, {
          key: 'declined',
          onClick: () => onRowAction?.('mark-declined', row)
        }, 'Mark as Declined')
      )
      menuItems.push(
        React.createElement(DropdownMenuSeparator, { key: 'sep2' })
      )
    }

    // Only show View Role Details if role still exists
    if (!isRoleDeleted) {
      menuItems.push(
        React.createElement(DropdownMenuItem, {
          key: 'role-details',
          onClick: () => onRowAction?.('view-role', row)
        }, 'View Role Details')
      )
    }
    menuItems.push(
      React.createElement(DropdownMenuItem, {
        key: 'assessment',
        onClick: () => onRowAction?.('view-assessment', row)
      }, 'View Assessment')
    )
    menuItems.push(
      React.createElement(DropdownMenuSeparator, { key: 'sep3' })
    )
    menuItems.push(
      React.createElement(DropdownMenuItem, {
        key: 'archive',
        onClick: () => onRowAction?.('archive', row)
      }, 'Archive Invite')
    )
  }

  return React.createElement(DropdownMenu, null, [
    React.createElement(DropdownMenuTrigger, {
      key: 'trigger',
      asChild: true
    }, React.createElement(Button, {
      variant: 'ghost',
      size: 'sm'
    }, React.createElement(MoreHorizontal, { className: 'w-4 h-4' }))),
    React.createElement(DropdownMenuContent, {
      key: 'content',
      align: 'end',
      className: 'w-48'
    }, menuItems)
  ])
}

// Job seeker invites table columns
export const jobSeekerInvitesTableColumns = [
  {
    key: 'company.name',
    label: 'Company',
    sortable: true,
    width: 'large' as const,
    render: renderCompanyLogo
  },
  {
    key: 'job.title',
    label: 'Role',
    sortable: true,
    render: (value: string, row: any) => {
      // Handle deleted roles
      if (!value || !row.job) {
        return React.createElement('span', {
          className: 'text-sm font-medium text-gray-500 italic'
        }, 'Role No Longer Available')
      }
      return React.createElement('span', {
        className: 'text-sm font-semibold text-gray-900'
      }, value)
    }
  },
  {
    key: 'proficiency_pct',
    label: 'Role Readiness',
    sortable: true,
    filterable: true,
    filterOptions: ['Ready', 'Almost There'],
    render: (value: any, row: any) => renderJobSeekerReadinessBadge(row.proficiency_pct)
  },
  {
    key: 'status',
    label: 'Status',
    filterable: true,
    filterOptions: ['Pending', 'Applied', 'Declined', 'Hired', 'Position Filled'],
    render: renderJobSeekerStatus
  },
  {
    key: 'actions',
    label: 'Actions',
    render: renderJobSeekerActions
  }
]
