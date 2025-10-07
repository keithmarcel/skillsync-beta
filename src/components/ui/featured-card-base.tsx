import React, { ReactNode } from 'react'
import { cn } from '@/lib/card-styles'

interface FeaturedCardBaseProps {
  className?: string
  children: ReactNode
}

interface FeaturedCardHeaderProps {
  children: ReactNode
  className?: string
}

interface FeaturedCardContentProps {
  children: ReactNode
  className?: string
}

interface FeaturedCardFooterProps {
  children: ReactNode
  className?: string
}

interface MetaPillProps {
  label: string
  className?: string
}

interface StatProps {
  label: string
  value: string
  className?: string
}

// Base card container with Figma specifications
export function FeaturedCardBase({ className, children }: FeaturedCardBaseProps) {
  return (
    <article
      className={cn(
        "w-[400px] max-w-full",
        "rounded-2xl border border-gray-200 bg-white shadow-sm",
        "overflow-hidden",
        className
      )}
      role="listitem"
    >
      {children}
    </article>
  )
}

// Header section with consistent padding
export function FeaturedCardHeader({ children, className }: FeaturedCardHeaderProps) {
  return (
    <div className={cn("p-7 pb-0", className)}>
      {children}
    </div>
  )
}

// Content section for description and other content
export function FeaturedCardContent({ children, className }: FeaturedCardContentProps) {
  return (
    <div className={cn("p-7 pb-0", className)}>
      {children}
    </div>
  )
}

// Footer section for actions
export function FeaturedCardFooter({ children, className }: FeaturedCardFooterProps) {
  return (
    <div className={cn("px-7 pt-4 pb-0 flex items-center justify-center gap-3", className)}>
      {children}
    </div>
  )
}

// Standardized divider
export function FeaturedCardDivider() {
  return <div className="mt-6 border-t border-gray-200" />
}

// Trusted partner badge with SVG from public folder
export function TrustedPartnerBadge({ 
  label = "Trusted Partner", 
  fixed = false 
}: { 
  label?: string; 
  fixed?: boolean 
}) {
  return (
    <img 
      src="/companies/badge_trusted-partner.svg" 
      alt={label}
      className="h-[20px] w-auto object-contain"
    />
  )
}

// Assessment recommendation badge with exact Figma specs
export function AssessmentRecommendationBadge({
  label = "My Assessment Recommendation",
  fixed = true,
  children, // optional icon
}: {
  label?: string;
  fixed?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={[
        "flex items-center gap-2",
        "px-2 py-1.5",
        "border border-[#E5E7EB] rounded-lg",
        "shadow-[0px_1px_2px_rgba(0,0,0,0.05)]",
        "bg-white",
        fixed ? "w-[170.67px] h-[46px]" : ""
      ].join(" ")}
      role="note"
      aria-label={label}
    >
      {children ?? (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2l1.8 4.2L16 7l-3.2 2.4L14 14l-4-2.2L6 14l1.2-4.6L4 7l4.2-.8L10 2z"
                stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
      <span className="text-[13px] font-medium leading-none text-neutral-800">{label}</span>
    </div>
  )
}

// Category colors matching high-demand occupations palette
const categoryColors: Record<string, { bg: string; text: string }> = {
  'Health & Education': { bg: '#F6F5FF', text: '#1E429F' },
  'Logistics': { bg: '#EDFAFA', text: '#014451' },
  'Hospitality': { bg: '#FCE8F3', text: '#633112' },
  'Finance & Legal': { bg: '#E5EDFF', text: '#42389D' },
  'Public Services': { bg: '#FFF8F1', text: '#8A2C0D' },
  'Tech & Services': { bg: '#EDEBFE', text: '#5521B5' },
  'Skilled Trades': { bg: '#FCE8F3', text: '#99154B' },
  'Business': { bg: '#E1EFFE', text: '#1E429F' },
  'Technology': { bg: '#EDEBFE', text: '#5521B5' }, // Alias for Tech & Services
}

// Meta pill component matching Figma specs
export function MetaPill({ label, className }: MetaPillProps) {
  // Check if this is a category badge
  const categoryColor = categoryColors[label]
  
  if (categoryColor) {
    return (
      <span
        className={cn(
          "inline-flex h-[22px] items-center rounded-full",
          "px-3 text-xs font-medium",
          className
        )}
        style={{
          backgroundColor: categoryColor.bg,
          color: categoryColor.text
        }}
      >
        {label}
      </span>
    )
  }
  
  // Default gray pill for non-category badges
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-full",
        "bg-gray-100 px-3 text-xs font-medium text-gray-700",
        className
      )}
    >
      {label}
    </span>
  )
}

// Stat display component matching exact Figma dimensions
export function Stat({ label, value, className }: StatProps) {
  const getIconWithBackground = (label: string) => {
    if (label.toLowerCase().includes('salary')) {
      return (
        <div 
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ 
            background: '#F3FAF7',
            padding: '2px 10px'
          }}
        >
          <svg 
            className="w-3 h-3 shrink-0" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#10B981" 
            strokeWidth="2"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )
    }
    if (label.toLowerCase().includes('proficiency')) {
      return (
        <div 
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ 
            background: '#F3FAF7',
            padding: '2px 10px'
          }}
        >
          <svg 
            className="w-3 h-3 shrink-0" 
            viewBox="0 0 24 24" 
            fill="#10B981"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn(
      "flex items-center gap-2",
      "px-2 py-1.5",
      "border border-[#E5E7EB] rounded-lg",
      "shadow-[0px_1px_2px_rgba(0,0,0,0.05)] bg-white",
      "h-[46px]",
      className
    )}>
      {/* Icon container - 20px */}
      {getIconWithBackground(label)}
      
      {/* Text column - stacked title and value */}
      <div className="flex flex-col justify-center">
        <span className="text-[11px] font-normal leading-4 text-[#6B7280]">
          {label}
        </span>
        <span className="text-sm font-semibold text-gray-900 leading-4">
          {value}
        </span>
      </div>
    </div>
  )
}

// Common header layout with badge and logo
export function FeaturedCardHeaderLayout({ 
  badge, 
  logo, 
  title, 
  subtitle,
  actionsMenu
}: {
  badge?: React.ReactNode
  logo?: React.ReactNode
  title: string
  subtitle?: string
  actionsMenu?: React.ReactNode
}) {
  return (
    <>
      <div className="flex items-center justify-between w-full">
        <div className="flex-1 flex items-center gap-3">
          {logo}
        </div>
        <div className="flex items-center gap-1">
          {badge && (
            <div className="flex-shrink-0">
              {badge}
            </div>
          )}
          {actionsMenu && (
            <div className="flex-shrink-0" style={{ marginLeft: badge ? '4px' : '0' }}>
              {actionsMenu}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-5 text-lg font-semibold leading-snug text-gray-900">
        {title}
      </h3>

      {/* Subtitle if provided */}
      {subtitle && (
        <p className="mt-1 text-sm text-gray-500">
          {subtitle}
        </p>
      )}
    </>
  )
}

// Common meta pills row
export function MetaPillsRow({ pills }: { pills: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((pill, index) => (
        <MetaPill key={index} label={pill} />
      ))}
    </div>
  )
}

// Description with 2-line clamp
export function FeaturedCardDescription({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-sm leading-6 text-gray-600 line-clamp-2">
      {children}
    </p>
  )
}

// Stats grid layout
export function StatsGrid({ stats }: { stats: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => (
        <Stat key={index} label={stat.label} value={stat.value} />
      ))}
    </div>
  )
}

// Action buttons with Figma styling
export function ActionButton({ 
  variant = 'secondary', 
  children, 
  onClick,
  href,
  className 
}: {
  variant?: 'primary' | 'secondary'
  children: ReactNode
  onClick?: () => void
  href?: string
  className?: string
}) {
  const baseClasses = "flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg shadow-[0px_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-8 flex-1 min-w-0 transition-colors duration-150 ease-in-out"
  
  const variantClasses = variant === 'primary' 
    ? "bg-white border border-[#047481] text-[#047481] hover:bg-[#047481] hover:text-white hover:border-[#047481]"
    : "bg-white border border-[#E5E5E5] text-gray-700 hover:bg-gray-50 hover:border-[#E5E5E5]"

  const combinedClasses = cn(baseClasses, variantClasses, className)

  const content = variant === 'primary' ? (
    <>
      {children}
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14m-7-7 7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </>
  ) : children

  if (href) {
    return (
      <a href={href} className={combinedClasses}>
        {content}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={combinedClasses}>
      {content}
    </button>
  )
}
