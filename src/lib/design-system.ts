/**
 * SkillSync Design System Constants
 * Ensures consistent styling across main app and admin tools
 */

// Brand Colors
export const COLORS = {
  primary: '#0694A2',
  primaryHover: '#0694A2/90',
  
  // Status Colors
  success: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    hover: 'hover:bg-green-100'
  },
  warning: {
    bg: 'bg-orange-100', 
    text: 'text-orange-800',
    hover: 'hover:bg-orange-100'
  },
  error: {
    bg: 'bg-red-100',
    text: 'text-red-800', 
    hover: 'hover:bg-red-100'
  }
} as const

// Button Styles
export const BUTTON_STYLES = {
  primary: `bg-[#0694A2] hover:bg-[#0694A2]/90 text-white`,
  secondary: `border border-gray-300 bg-white hover:bg-gray-50 text-gray-700`,
  ghost: `hover:bg-gray-50 text-gray-700`,
  destructive: `bg-red-600 hover:bg-red-700 text-white`
} as const

// Navigation Styles
export const NAVIGATION_STYLES = {
  active: `bg-[#0694A2] text-white`,
  hover: `hover:bg-gray-200`, // Changed from gray-50 to gray-200 for darker hover
  default: `text-gray-900`,
  padding: `px-4 py-2`,
  borderRadius: `rounded-lg`
} as const

// Layout Constants
export const LAYOUT = {
  container: `max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8`,
  adminContainer: `max-w-[1280px] mx-auto px-6`,
  pageSpacing: `py-8`,
  sectionSpacing: `space-y-6`,
  cardStyle: `rounded-xl border bg-white`
} as const

// Table Styles
export const TABLE_STYLES = {
  container: `w-full rounded-xl border border-[#E5E5E5] bg-[#FCFCFC] p-2 overflow-x-auto`,
  header: `bg-[#F9FAFB] text-[#114B5F] text-xs font-semibold uppercase tracking-wide border-b border-[#E5E7EB]`,
  cell: `py-6 px-6 font-normal`,
  actionCell: `py-6 px-6 text-center`,
  row: `border-b border-[#E5E7EB] hover:bg-gray-50/50`
} as const

// Input Styles  
export const INPUT_STYLES = {
  search: `pl-9 h-10`,
  default: `h-10`,
  small: `h-8`,
  searchIcon: `absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`
} as const

// Status Switch Styles
export const STATUS_STYLES = {
  container: `flex items-center gap-2`,
  label: `capitalize text-sm`,
  switch: `data-[state=checked]:bg-[#0694A2]`
} as const

// Spacing Constants
export const SPACING = {
  headerToContent: `mt-8`,
  controlsToTable: `mt-5`, 
  searchToFilters: `gap-4`,
  buttonIcon: `mr-2 h-4 w-4`,
  cardPadding: `p-6`
} as const
