/**
 * Standardized Card Component Interfaces
 * Consistent prop patterns across all card components
 */

import { ReactNode } from 'react'

// Base interface that all cards should extend
export interface BaseCardProps {
  id: string
  className?: string
  onClick?: () => void
}

// Common action interface
export interface CardAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  icon?: ReactNode
}

// Badge interface
export interface CardBadge {
  label: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  color?: string
}

// Status interface
export interface CardStatus {
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  score?: number
  indicator?: boolean
}

// Company/Organization interface
export interface CardOrganization {
  name: string
  logo?: string
  bio?: string
  headquarters?: string
  revenue?: string
  employees?: string
  industry?: string
  isTrustedPartner?: boolean
}

// Metric interface for info boxes
export interface CardMetric {
  label: string
  value: string | number
  icon?: ReactNode
  format?: 'currency' | 'percentage' | 'number' | 'text'
}

// Skills callout interface
export interface CardSkillsCallout {
  type: 'jobs' | 'skills' | 'programs'
  count: number
  label: string
  href?: string
}

// Progress interface
export interface CardProgress {
  current: number
  total: number
  label: string
  showPercentage?: boolean
}

// Standardized card interfaces

export interface ActionCardProps extends BaseCardProps {
  title: string
  description: string
  action: CardAction
  variant?: 'primary' | 'secondary'
}

export interface MetricCardProps extends BaseCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
}


export interface ListCardProps extends BaseCardProps {
  title: string
  description: string
  items: Array<{
    id: string
    title: string
    description: string
    href: string
  }>
  viewAllAction: CardAction
}

export interface FeaturedRoleCardProps extends BaseCardProps {
  title: string
  company: CardOrganization
  category: string
  jobType: string
  skillsCount: number
  description: string
  medianSalary: number
  requiredProficiency: number
  href: string
  onAboutCompany?: () => void
  badges?: CardBadge[]
}

export interface FeaturedProgramCardProps extends BaseCardProps {
  name: string
  school: CardOrganization
  programType: string
  format: string
  duration: string
  description: string
  skillsCallout?: CardSkillsCallout
  href?: string
  aboutSchoolHref?: string
  programDetailsHref?: string
  isFavorited?: boolean
  onAddFavorite?: () => void
  onRemoveFavorite?: () => void
}

export interface AssessmentCardProps extends BaseCardProps {
  jobTitle: string
  jobType: 'Featured Role' | 'High Demand Occupation'
  status: CardStatus
  assessmentMethod: 'Skills Assessment'
  analyzedDate: string
  progress: CardProgress
  specificGaps?: string[]
  actions: CardAction[]
  badges?: CardBadge[]
}

// Card layout variants
export type CardSize = 'sm' | 'md' | 'lg'
export type CardVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'
export type CardLayout = 'vertical' | 'horizontal' | 'compact'

// Common card configuration
export interface CardConfig {
  size?: CardSize
  variant?: CardVariant
  layout?: CardLayout
  showHover?: boolean
  showShadow?: boolean
}

// Helper type for card with common props
export interface StandardCardProps extends BaseCardProps {
  title: string
  description?: string
  config?: CardConfig
  badges?: CardBadge[]
  actions?: CardAction[]
  status?: CardStatus
}

// Validation helpers
export const validateCardAction = (action: CardAction): boolean => {
  return !!(action.label && (action.href || action.onClick))
}

export const validateCardBadge = (badge: CardBadge): boolean => {
  return !!badge.label
}

export const validateCardStatus = (status: CardStatus): boolean => {
  return !!(status.type && status.message)
}

// Default configurations
export const defaultCardConfig: CardConfig = {
  size: 'md',
  variant: 'default',
  layout: 'vertical',
  showHover: true,
  showShadow: true,
}

export const defaultCardAction: Partial<CardAction> = {
  variant: 'primary',
}

export const defaultCardBadge: Partial<CardBadge> = {
  variant: 'default',
}

// Type guards
export const isCardAction = (obj: any): obj is CardAction => {
  return obj && typeof obj.label === 'string'
}

export const isCardBadge = (obj: any): obj is CardBadge => {
  return obj && typeof obj.label === 'string'
}

export const isCardStatus = (obj: any): obj is CardStatus => {
  return obj && typeof obj.type === 'string' && typeof obj.message === 'string'
}
