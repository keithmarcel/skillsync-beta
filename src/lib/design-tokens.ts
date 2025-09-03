/**
 * Design Tokens for SkillSync Application
 * Centralized design system values for consistent UI
 */

export const designTokens = {
  // Color System
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#F0FDFA',
      100: '#CCFBF1',
      500: '#0694A2', // Main teal
      600: '#0891B2',
      700: '#047481',
      900: '#134E4A',
    },
    
    // Secondary Colors
    secondary: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      500: '#114B5F', // Header blue
      600: '#0F3A4A',
      700: '#0D2B35',
      900: '#0A1F28',
    },
    
    // Status Colors
    success: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
    },
    
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
    },
    
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
    },
    
    // Neutral Colors
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  
  // Typography System
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
  },
  
  // Spacing System
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '3rem',   // 48px
    '4xl': '4rem',   // 64px
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    full: '9999px',
  },
  
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Layout Constraints
  layout: {
    maxWidth: {
      container: '1280px',
      content: '1232px',
      prose: '65ch',
    },
    
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
} as const

// Utility functions for accessing tokens
export const getColor = (path: string) => {
  const keys = path.split('.')
  let value: any = designTokens.colors
  
  for (const key of keys) {
    value = value?.[key]
  }
  
  return value
}

export const getSpacing = (size: keyof typeof designTokens.spacing) => {
  return designTokens.spacing[size]
}

export const getFontSize = (size: keyof typeof designTokens.typography.fontSize) => {
  return designTokens.typography.fontSize[size]
}

// CSS Custom Properties for runtime usage
export const cssVariables = {
  '--color-primary': designTokens.colors.primary[500],
  '--color-primary-hover': designTokens.colors.primary[600],
  '--color-secondary': designTokens.colors.secondary[500],
  '--color-success': designTokens.colors.success[500],
  '--color-warning': designTokens.colors.warning[500],
  '--color-error': designTokens.colors.error[500],
  '--spacing-sm': designTokens.spacing.sm,
  '--spacing-md': designTokens.spacing.md,
  '--spacing-lg': designTokens.spacing.lg,
  '--spacing-xl': designTokens.spacing.xl,
  '--border-radius-lg': designTokens.borderRadius.lg,
  '--border-radius-xl': designTokens.borderRadius.xl,
  '--container-max-width': designTokens.layout.maxWidth.container,
  '--content-max-width': designTokens.layout.maxWidth.content,
}
