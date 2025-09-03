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

// Helper function to render neutral badges (for program types)
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
  },
  {
    key: 'company.name',
    label: 'Company',
    sortable: true,
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    width: 'medium',
    filterable: true,
    filterOptions: ['Business', 'Health & Education', 'Tech & Services', 'Finance & Legal', 'Skilled Trades', 'Logistics', 'Hospitality', 'Public Services'],
    render: (value: string) => renderCategoryBadge(value),
  },
  {
    key: 'median_salary',
    label: 'AVG Salary',
    sortable: true,
    width: 'small',
  },
  {
    key: 'role_readiness',
    label: 'Role Readiness',
    sortable: true,
    width: 'medium',
  },
  {
    key: 'location_city',
    label: 'Location',
    render: (value: string, row: any) => 
      row.location_city && row.location_state 
        ? `${row.location_city}, ${row.location_state}`
        : 'Location TBD',
  },
  {
    key: 'median_wage_usd',
    label: 'Salary',
    sortable: true,
    render: (value: number) => formatSalary(value),
  },
  {
    key: 'readiness',
    label: 'Role Readiness',
    filterable: true,
    filterOptions: ['Assess Skills', 'Close Gaps', 'Ready'],
    render: (value: string) => renderReadinessBadge(value || 'assess skills'),
  },
  {
    key: 'actions',
    label: '',
    width: 'small',
  },
]

export const occupationsTableColumns = [
  {
    key: 'title',
    label: 'Occupation',
    sortable: true,
    width: 'large', // Large column
  },
  {
    key: 'description',
    label: 'Summary',
    sortable: true,
    width: 'large', // Large column
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    filterable: true,
    filterOptions: ['Business', 'Health & Education', 'Tech & Services', 'Finance & Legal', 'Skilled Trades', 'Logistics', 'Hospitality', 'Public Services'],
    render: (value: string) => renderCategoryBadge(value),
    width: 'small', // Small column for badges
  },
  {
    key: 'median_wage_usd',
    label: 'AVG Salary',
    sortable: true,
    render: (value: number) => formatSalary(value),
    width: 'medium',
  },
  {
    key: 'readiness',
    label: 'Role Readiness',
    filterable: true,
    filterOptions: ['Assess Skills', 'Close Gaps', 'Ready'],
    render: (value: string) => renderReadinessBadge(value || 'assess skills'),
    width: 'medium', // Medium column
  },
  {
    key: 'actions',
    label: 'Actions',
  },
]

export const programsTableColumns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    width: 'large',
  },
  {
    key: 'short_desc',
    label: 'Summary',
    sortable: true,
    width: 'large',
  },
  {
    key: 'program_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    filterOptions: ['Certificate', "Associate's", 'Bachelor Degree', 'Apprenticeship', 'Bootcamp'],
    render: (value: string) => renderNeutralBadge(value),
    width: 'small',
  },
  {
    key: 'format',
    label: 'Format',
    filterable: true,
    filterOptions: ['Online', 'Hybrid', 'In-person'],
    render: (value: string) => renderNeutralBadge(value),
    width: 'small',
  },
  {
    key: 'school.name',
    label: 'School',
    sortable: true,
    width: 'medium',
  },
  {
    key: 'actions',
    label: 'Actions',
    width: 'small',
  },
]

// Search field configurations
export const jobsSearchFields = ['title', 'company.name', 'category', 'location_city', 'location_state']
export const occupationsSearchFields = ['title', 'soc_code', 'category', 'education_requirements']
export const programsSearchFields = ['name', 'school.name', 'program_type', 'format']
