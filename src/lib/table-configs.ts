import React from 'react'
import { Badge } from '@/components/ui/badge'

// Badge color mapping from Figma design - using exact specs
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

// Helper function to render category badges
export const renderCategoryBadge = (category: string) => {
  const colors = categoryColors[category as keyof typeof categoryColors] || { bg: '#F3F4F6', text: '#111928' }
  // Convert to title case unless it's a sentence
  const titleCaseCategory = category.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
  
  return React.createElement(Badge, {
    style: { 
      backgroundColor: colors.bg, 
      color: colors.text,
      borderRadius: '10px',
      boxShadow: 'none' // Remove drop shadow
    },
    className: "font-medium border-0"
  }, titleCaseCategory)
}

// Helper function to shorten program type names
const shortenProgramType = (programType: string): string => {
  const typeMap: Record<string, string> = {
    "Associate's": "Associate",
    "Associate's Degree": "Associate",
    "Bachelor Degree": "Bachelor",
    "Bachelor's": "Bachelor",
    "Bachelor's Degree": "Bachelor",
    "Master's": "Master",
    "Master's Degree": "Master",
    "Masters": "Master",
    "Certificate": "Certificate",
    "Apprenticeship": "Apprenticeship",
    "Bootcamp": "Bootcamp"
  }
  return typeMap[programType] || programType
}

// Helper function to render program type badges (shortened)
export const renderProgramTypeBadge = (value: string) => {
  const shortened = shortenProgramType(value)
  
  return React.createElement(Badge, {
    style: { 
      backgroundColor: '#F3F4F6', 
      color: '#374151',
      borderRadius: '10px',
      boxShadow: 'none'
    },
    className: "font-medium border-0"
  }, shortened)
}

// Helper function to render neutral badges (for other types)
export const renderNeutralBadge = (value: string) => {
  const titleCaseValue = value.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
  
  return React.createElement(Badge, {
    style: { 
      backgroundColor: '#F3F4F6', 
      color: '#374151',
      borderRadius: '10px',
      boxShadow: 'none'
    },
    className: "font-medium border-0"
  }, titleCaseValue)
}

// Helper function to render readiness badges
export const renderReadinessBadge = (readiness: string) => {
  const colors = readinessColors[readiness as keyof typeof readinessColors] || { bg: '#F3F4F6', text: '#374151' }
  // Convert to title case unless it's a sentence
  const titleCaseReadiness = readiness.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
  
  return React.createElement(Badge, {
    style: { 
      backgroundColor: colors.bg, 
      color: colors.text,
      borderRadius: '10px',
      boxShadow: 'none' // Remove drop shadow
    },
    className: "font-medium border-0"
  }, titleCaseReadiness)
}

// Helper function to render "Hiring Now" badge
export const renderHiringNowBadge = () => {
  return React.createElement(Badge, {
    style: { 
      backgroundColor: '#ECFDF5', 
      color: '#065F46',
      borderRadius: '10px',
      boxShadow: 'none'
    },
    className: "font-medium border-0 text-xs w-fit"
  }, 'Hiring Now')
}

// Helper function to render job title with conditional badges for Favorites tab
export const renderJobTitleWithBadges = (item: any, isOnFavoritesTab: boolean = false) => {
  const title = item.title
  const jobKind = item.job_kind
  
  if (!isOnFavoritesTab) {
    return title
  }
  
  // Only featured roles get "Hiring Now" badge in Job Title column below the title
  // Occupations show just the title with no badges
  if (jobKind === 'featured_role') {
    const badge = renderHiringNowBadge()
    return React.createElement('div', { className: 'flex flex-col gap-1.5' }, [
      React.createElement('span', { key: 'title' }, title),
      badge ? React.cloneElement(badge, { key: 'badge' }) : null
    ].filter(Boolean))
  }
  
  // Occupations show just the title
  return title
}

// Helper function to format salary
export const formatSalary = (salary: number) => {
  return `$${salary?.toLocaleString() || 0}`
}

// Table column configurations
export const jobsTableColumns = [
  {
    key: 'title',
    label: 'Role Title',
    sortable: true,
    width: 'large' as const,
  },
  {
    key: 'company.name',
    label: 'Company',
    sortable: true,
    width: 'medium' as const,
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    width: 'medium' as const,
    filterable: true,
    filterOptions: ['Business', 'Health & Education', 'Tech & Services', 'Finance & Legal', 'Skilled Trades', 'Logistics', 'Hospitality', 'Public Services'],
    render: (value: string) => renderCategoryBadge(value),
  },
  {
    key: 'median_salary',
    label: 'AVG Salary',
    sortable: true,
    width: 'small' as const,
  },
  {
    key: 'role_readiness',
    label: 'Role Readiness',
    sortable: true,
    width: 'medium' as const,
  },
  {
    key: 'location_city',
    label: 'Location',
    width: 'medium' as const,
    render: (value: string, row: any) => 
      row.location_city && row.location_state 
        ? `${row.location_city}, ${row.location_state}`
        : 'Location TBD',
  },
  {
    key: 'median_wage_usd',
    label: 'Salary',
    sortable: true,
    width: 'medium' as const,
    render: (value: number) => formatSalary(value),
  },
  {
    key: 'readiness',
    label: 'Role Readiness',
    filterable: true,
    filterOptions: ['Assess Skills', 'Close Gaps', 'Ready'],
    width: 'medium' as const,
    render: (value: string) => renderReadinessBadge(value || 'assess skills'),
  },
  {
    key: 'actions',
    label: '',
    width: 'small' as const,
  },
]

export const occupationsTableColumns = [
  {
    key: 'title',
    label: 'Job Title',
    sortable: true,
    width: 'large' as const,
    render: (value: string, item: any, isOnFavoritesTab?: boolean) => renderJobTitleWithBadges(item, isOnFavoritesTab),
  },
  {
    key: 'description',
    label: 'Summary',
    sortable: true,
    width: 'xlarge' as const,
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    filterable: true,
    filterOptions: ['Business', 'Health & Education', 'Tech & Services', 'Finance & Legal', 'Skilled Trades', 'Logistics', 'Hospitality', 'Public Services'],
    render: (value: string) => renderCategoryBadge(value),
    width: 'small' as const,
    align: 'center' as const,
  },
  {
    key: 'related_jobs',
    label: 'Open Roles',
    sortable: true,
    render: (value: any, item: any) => {
      const count = item.related_jobs_count || 0
      const elementType = count === 0 ? 'span' : 'a'
      const props: any = {
        className: `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
          count === 0 
            ? 'bg-gray-100 text-gray-500 cursor-default' 
            : 'bg-[#CCFBF1] text-[#0F766E] hover:bg-[#99F6E4] cursor-pointer'
        }`
      }
      if (count > 0) {
        props.href = `/occupations/${item.soc_code}#open-roles`
      }
      return React.createElement(elementType, props, `${count} Open Role${count !== 1 ? 's' : ''}`)
    },
    width: 'medium' as const,
    align: 'center' as const,
  },
  {
    key: 'related_programs',
    label: 'Programs',
    sortable: true,
    render: (value: any, item: any) => {
      const count = item.related_programs_count || 0
      const elementType = count === 0 ? 'span' : 'a'
      const props: any = {
        className: `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
          count === 0 
            ? 'bg-gray-100 text-gray-500 cursor-default' 
            : 'bg-[#CCFBF1] text-[#0F766E] hover:bg-[#99F6E4] cursor-pointer'
        }`
      }
      if (count > 0) {
        props.href = `/occupations/${item.soc_code}#programs`
      }
      return React.createElement(elementType, props, `${count} Match${count !== 1 ? 'es' : ''}`)
    },
    width: 'medium' as const,
    align: 'center' as const,
  },
  {
    key: 'actions',
    label: 'Actions',
    width: 'small' as const,
  },
]

export const programsTableColumns = [
  {
    key: 'name',
    label: 'Program Name',
    sortable: true,
    width: 'large' as const,
    render: (value: string, row: any, isOnFavoritesTab?: boolean, onRowAction?: (action: string, row: any) => void) => {
      const relatedJobsCount = row.related_jobs_count || 0
      // Only return the badge, the value is rendered separately in the Link
      return relatedJobsCount > 0 ? React.createElement(Badge, {
        style: {
          backgroundColor: '#EFF6FF',
          color: '#1E40AF',
          borderRadius: '10px',
          boxShadow: 'none',
          cursor: 'pointer'
        },
        className: 'font-medium border-0 text-xs shrink-0 w-fit transition-all duration-200',
        onClick: (e: any) => {
          e.preventDefault()
          e.stopPropagation()
          if (onRowAction) {
            onRowAction('tertiary', row)
          }
        },
        onMouseDown: (e: any) => {
          e.preventDefault()
        },
        onMouseEnter: (e: any) => {
          e.currentTarget.style.backgroundColor = '#DBEAFE'
          e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)'
        },
        onMouseLeave: (e: any) => {
          e.currentTarget.style.backgroundColor = '#EFF6FF'
          e.currentTarget.style.boxShadow = 'none'
        }
      }, `Provides Skills for ${relatedJobsCount} ${relatedJobsCount === 1 ? 'Job' : 'Jobs'}`) : null
    },
  },
  {
    key: 'short_desc',
    label: 'Summary',
    sortable: true,
    width: 'large' as const,
  },
  {
    key: 'program_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterOptions: ['Certificate', "Associate's", 'Bachelor Degree', 'Apprenticeship', 'Bootcamp'],
    render: (value: string) => renderProgramTypeBadge(value),
    width: 'small' as const,
  },
  {
    key: 'format',
    label: 'Format',
    filterable: true,
    filterOptions: ['Online', 'Hybrid', 'In-person'],
    render: (value: string) => renderNeutralBadge(value),
    width: 'small' as const,
  },
  {
    key: 'school.name',
    label: 'School',
    sortable: true,
    width: 'medium' as const,
    render: (value: string, row: any) => {
      const schoolLogo = row.school?.logo
      return schoolLogo 
        ? React.createElement('img', {
            src: schoolLogo,
            alt: value || 'School logo',
            className: 'h-10 w-auto max-w-[140px] object-contain'
          })
        : React.createElement('span', { className: 'text-sm text-gray-900' }, value)
    },
  },
  {
    key: 'actions',
    label: 'Actions',
    width: 'small' as const,
  },
]

// Search field configurations
export const jobsSearchFields = ['title', 'company.name', 'category', 'location_city', 'location_state']
export const occupationsSearchFields = ['title', 'soc_code', 'category', 'education_requirements']
export const programsSearchFields = ['name', 'school.name', 'program_type', 'format']
