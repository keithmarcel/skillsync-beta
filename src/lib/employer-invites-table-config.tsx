import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isTopPerformer, isReady } from '@/lib/utils/proficiency-helpers'

// Helper to render Top Performer badge (matching Hiring Now badge from favorites)
const renderTopPerformerBadge = () => {
  return React.createElement(Badge, {
    style: {
      backgroundColor: '#ECFDF5',
      color: '#065F46',
      borderRadius: '10px',
      boxShadow: 'none'
    },
    className: 'font-medium border-0 text-xs w-fit'
  }, 'Top Performer')
}

// Helper to render name with avatar and optional Top Performer badge
export const renderCandidateName = (value: string, row: any) => {
  const user = row.user
  if (!user) return value

  const fullName = `${user.first_name} ${user.last_name}`
  const requiredProficiency = row.job?.required_proficiency_pct || 90
  const showTopPerformerBadge = isTopPerformer(row.proficiency_pct, requiredProficiency)

  return React.createElement('div', { className: 'flex items-center gap-3' }, [
    // Avatar
    user.avatar_url 
      ? React.createElement('img', {
          key: 'avatar',
          src: user.avatar_url,
          alt: fullName,
          className: 'w-10 h-10 rounded-full object-cover'
        })
      : React.createElement('div', {
          key: 'avatar',
          className: 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center'
        }, React.createElement('span', {
          className: 'text-gray-600 font-medium text-sm'
        }, `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`)),
    // Name and badge
    React.createElement('div', { key: 'name', className: 'flex flex-col gap-1.5' }, 
      showTopPerformerBadge ? [
        React.createElement('span', {
          key: 'text',
          className: 'text-base font-semibold text-gray-900 font-source-sans-pro'
        }, fullName),
        React.createElement('span', { key: 'badge' }, renderTopPerformerBadge())
      ] : [
        React.createElement('span', {
          key: 'text',
          className: 'text-base font-semibold text-gray-900 font-source-sans-pro'
        }, fullName)
      ]
    )
  ])
}

// Helper to render role readiness badge with proficiency percentage
export const renderRoleReadinessBadge = (proficiency: number, requiredProficiency: number = 90) => {
  // Use centralized proficiency helper
  if (isReady(proficiency, requiredProficiency)) {
    return React.createElement('span', {
      className: 'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800'
    }, [
      React.createElement('span', { key: 'label' }, 'Ready'),
      React.createElement('span', { key: 'divider', className: 'text-green-600' }, '|'),
      React.createElement('span', { key: 'percent', className: 'font-semibold' }, `${proficiency}%`)
    ])
  } else {
    // Almost There = below required proficiency
    return React.createElement('span', {
      className: 'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800'
    }, [
      React.createElement('span', { key: 'label' }, 'Almost There'),
      React.createElement('span', { key: 'divider', className: 'text-orange-600' }, '|'),
      React.createElement('span', { key: 'percent', className: 'font-semibold' }, `${proficiency}%`)
    ])
  }
}

// Helper to render status badge or button
export const renderStatusColumn = (status: string, row: any, isOnFavoritesTab?: boolean, onRowAction?: (action: string, row: any) => void) => {
  // If archived, show the status before archive (or 'archived' if no previous status)
  const displayStatus = status === 'archived' 
    ? (row.status_before_archive || 'archived')
    : status
  
  // For pending status, show Invite to Apply button (but not if archived)
  if (displayStatus === 'pending' && status !== 'archived') {
    return React.createElement(Button, {
      size: 'sm',
      onClick: () => onRowAction?.('send-invite', row),
      className: 'bg-teal-600 hover:bg-[#114B5F] text-white min-w-[120px]'
    }, 'Invite to Apply')
  }

  const statusConfig: Record<string, { bg: string, text: string, label: string, icon?: any }> = {
    sent: { bg: 'bg-gray-200', text: 'text-gray-700', label: 'Invite Sent' },
    applied: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Applied', icon: Check },
    declined: { bg: 'bg-red-100', text: 'text-red-800', label: 'Declined', icon: X },
    hired: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Hired' },
    unqualified: { bg: 'border border-gray-300 bg-white', text: 'text-gray-700', label: 'Unqualified' },
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
    className: `inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium ${config.bg} ${config.text} min-w-[120px] gap-1.5`
  }, children)
}

// Helper to render actions dropdown
export const renderActionsDropdown = (value: any, row: any, isOnFavoritesTab?: boolean, onRowAction?: (action: string, row: any) => void) => {
  const menuItems = []
  const isArchived = row.status === 'archived'
  
  // If archived, show restore option
  if (isArchived) {
    menuItems.push(
      React.createElement(DropdownMenuItem, {
        key: 'restore',
        onClick: () => onRowAction?.('restore', row)
      }, 'Restore Candidate')
    )
  } else {
    // Invite to Apply - only for pending status
    if (row.status === 'pending') {
      menuItems.push(
        React.createElement(DropdownMenuItem, {
          key: 'invite',
          onClick: () => onRowAction?.('send-invite', row)
        }, 'Invite to Apply')
      )
    }
    
    // View LinkedIn - always show
    menuItems.push(
      React.createElement(DropdownMenuItem, {
        key: 'linkedin',
        onClick: () => onRowAction?.('view-linkedin', row),
        disabled: !row.user?.linkedin_url
      }, 'View LinkedIn')
    )
    
    // Mark as Hired/Unqualified - only for sent, applied, declined statuses
    if (row.status !== 'pending' && row.status !== 'hired' && row.status !== 'unqualified') {
      menuItems.push(
        React.createElement(DropdownMenuSeparator, { key: 'sep1' }),
        React.createElement(DropdownMenuItem, {
          key: 'hired',
          onClick: () => onRowAction?.('mark-hired', row)
        }, 'Mark as Hired'),
        React.createElement(DropdownMenuItem, {
          key: 'unqualified',
          onClick: () => onRowAction?.('mark-unqualified', row)
        }, 'Mark as Unqualified')
      )
    }
    
    // Archive - always show for non-archived
    menuItems.push(
      React.createElement(DropdownMenuSeparator, { key: 'sep2' }),
      React.createElement(DropdownMenuItem, {
        key: 'archive',
        onClick: () => onRowAction?.('archive', row)
      }, 'Archive Candidate')
    )
  }
  
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

// Employer invites table columns
export const employerInvitesTableColumns = [
  {
    key: 'user.first_name',
    label: 'Name',
    sortable: true,
    width: 'large' as const,
    render: renderCandidateName
  },
  {
    key: 'job.title',
    label: 'Role',
    sortable: true,
    render: (value: string) => React.createElement('span', {
      className: 'text-base font-semibold text-gray-900 font-source-sans-pro whitespace-nowrap'
    }, value)
  },
  {
    key: 'proficiency_pct',
    label: 'Role Readiness',
    width: 'medium' as const,
    sortable: true,
    filterable: true,
    filterOptions: ['Ready', 'Almost There'],
    render: (value: any, row: any) => renderRoleReadinessBadge(row.proficiency_pct, row.job?.required_proficiency_pct || 90)
  },
  {
    key: 'status',
    label: 'Status',
    filterable: true,
    filterOptions: ['Pending', 'Sent', 'Applied', 'Declined', 'Hired', 'Unqualified'],
    width: 'medium' as const,
    render: renderStatusColumn
  },
  {
    key: 'actions',
    label: 'Actions',
    width: 'extra-small' as const,
    render: (value: any, row: any, isOnFavoritesTab?: boolean, onRowAction?: (action: string, row: any) => void) => React.createElement('div', {
      className: 'flex justify-center'
    }, renderActionsDropdown(value, row, isOnFavoritesTab, onRowAction))
  }
]
