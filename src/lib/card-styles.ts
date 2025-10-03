/**
 * Reusable Card Style Utilities
 * Extracted from repeated patterns across card components
 */

import { designTokens } from './design-tokens'

// Base card styles
export const cardStyles = {
  // Base card container
  base: 'rounded-xl border bg-card text-card-foreground shadow-sm',
  hover: 'hover:shadow-md transition-shadow',
  
  // Card variants
  variants: {
    default: 'bg-white border-gray-200',
    primary: 'bg-teal-600 text-white border-teal-600',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-orange-50 border-orange-200',
    error: 'bg-red-50 border-red-200',
  },
  
  // Header styles
  header: {
    base: 'flex flex-col space-y-1.5 p-6',
    compact: 'pb-4',
    withActions: 'flex flex-row items-center justify-between space-y-0',
  },
  
  // Content styles
  content: {
    base: 'p-6 pt-0',
    full: 'p-6',
    spaced: 'space-y-6',
    compact: 'space-y-4',
  },
  
  // Title styles
  title: {
    base: 'font-semibold leading-none tracking-tight',
    sizes: {
      sm: 'text-lg',
      md: 'text-xl', 
      lg: 'text-2xl',
    },
    colors: {
      default: 'text-gray-900',
      muted: 'text-gray-600',
      white: 'text-white',
    },
  },
  
  // Description styles
  description: {
    base: 'text-sm leading-relaxed',
    colors: {
      default: 'text-gray-600',
      muted: 'text-gray-500',
      light: 'text-teal-50',
    },
  },
} as const

// Badge styles
export const badgeStyles = {
  base: 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
  
  variants: {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-200 bg-white text-gray-800',
    primary: 'bg-teal-100 text-teal-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-orange-100 text-orange-800',
    error: 'bg-red-100 text-red-800',
  },
  
  sizes: {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  },
} as const

// Button styles for cards
export const cardButtonStyles = {
  primary: 'bg-teal-600 hover:bg-[#114B5F] text-white font-medium',
  secondary: 'border-gray-200 hover:bg-gray-50',
  outline: 'border border-gray-200 hover:bg-gray-50',
  ghost: 'hover:bg-gray-50',
  
  sizes: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  },
  layouts: {
    full: 'w-full',
    flex: 'flex-1',
    inline: 'inline-flex',
  },
} as const

// Layout utilities
export const layoutStyles = {
  // Container patterns
  container: {
    base: 'max-w-[1280px] mx-auto px-6',
    content: 'max-w-[1232px] mx-auto',
    narrow: 'max-w-4xl mx-auto px-6',
  },
  
  // Grid patterns
  grid: {
    cards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    metrics: 'grid grid-cols-1 md:grid-cols-3 gap-6',
    twoCol: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  },
  
  // Flex patterns
  flex: {
    between: 'flex items-center justify-between',
    start: 'flex items-start',
    center: 'flex items-center',
    gap: {
      sm: 'gap-2',
      md: 'gap-3', 
      lg: 'gap-4',
      xl: 'gap-6',
    },
  },
  
  // Spacing patterns
  spacing: {
    section: 'mt-8',
    element: 'mb-4',
    compact: 'mb-2',
    relaxed: 'mb-6',
  },
} as const

// Info box styles (used in featured cards)
export const infoBoxStyles = {
  base: 'bg-gray-50 rounded-xl p-4',
  
  variants: {
    default: 'bg-gray-50',
    primary: 'bg-teal-50',
    success: 'bg-green-50',
    warning: 'bg-orange-50',
    error: 'bg-red-50',
  },
  
  content: {
    header: 'flex items-center gap-2 mb-1',
    label: 'text-sm text-gray-600',
    value: 'text-xl font-bold text-gray-900',
  },
} as const

// Status message styles
export const statusStyles = {
  base: 'flex items-center gap-2 text-sm p-3 rounded-lg',
  
  variants: {
    success: 'text-green-700 bg-green-50',
    warning: 'text-orange-700 bg-orange-50', 
    error: 'text-red-700 bg-red-50',
    info: 'text-blue-700 bg-blue-50',
  },
  
  indicator: 'w-2 h-2 rounded-full',
  indicatorColors: {
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  },
} as const

// Utility function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ')
}

// Helper functions for common patterns
export const getCardClasses = (variant: keyof typeof cardStyles.variants = 'default', withHover = true) => {
  return cn(
    cardStyles.base,
    cardStyles.variants[variant],
    withHover && cardStyles.hover
  )
}

export const getBadgeClasses = (
  variant: keyof typeof badgeStyles.variants = 'default',
  size: keyof typeof badgeStyles.sizes = 'md'
) => {
  return cn(
    badgeStyles.base,
    badgeStyles.variants[variant],
    badgeStyles.sizes[size]
  )
}

export const getButtonClasses = (
  variant: keyof typeof cardButtonStyles = 'primary',
  size: keyof typeof cardButtonStyles.sizes = 'md',
  layout?: keyof typeof cardButtonStyles.layouts
) => {
  const variantClass = typeof cardButtonStyles[variant] === 'string' ? cardButtonStyles[variant] : ''
  const sizeClass = cardButtonStyles.sizes[size]
  const layoutClass = layout ? cardButtonStyles.layouts[layout] : ''
  
  return cn(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    variantClass,
    sizeClass,
    layoutClass
  )
}
