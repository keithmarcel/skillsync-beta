'use client'

import { cn } from '@/lib/card-styles'
import { StatsGrid } from './featured-card-base'

interface SimpleJobCardProps {
  id: string
  title: string
  company: {
    name: string
    logo?: string
  }
  description?: string
  medianWage?: number
  requiredProficiency?: number
  className?: string
}

/**
 * Simplified Job Card for Crosswalk Pages
 * Minimal design for HDO detail pages showing related Featured Roles
 * Matches SimpleProgramCard design language with StatsGrid callout
 */
export function SimpleJobCard({
  id,
  title,
  company,
  description,
  medianWage,
  requiredProficiency,
  className = ''
}: SimpleJobCardProps) {
  // Build stats array for callout
  const stats = []
  if (medianWage) {
    stats.push({ label: "Median Salary", value: `$${medianWage.toLocaleString()}` })
  }
  if (requiredProficiency) {
    stats.push({ label: "Required Proficiency", value: `${requiredProficiency}%` })
  }

  return (
    <article
      className={cn(
        "w-full max-w-full h-full",
        "rounded-2xl border border-gray-200 bg-white shadow-sm",
        "overflow-hidden",
        "transition-all duration-300 ease-in-out hover:shadow-md will-change-transform",
        "cursor-pointer",
        className
      )}
      role="listitem"
    >
      <div className="p-6">
        {/* Company Logo */}
        {company.logo && (
          <div className="mb-4 h-8 flex items-center">
            <img
              src={company.logo}
              alt={company.name}
              className="h-8 w-auto max-w-[120px] object-contain object-left"
            />
          </div>
        )}

        {/* Job Title */}
        <h3 className="text-[20px] font-bold text-gray-900 leading-tight font-source-sans-pro line-clamp-2 mb-3 hover:text-teal-700 transition-colors duration-300 ease-in-out">
          {title}
        </h3>

        {/* Hidden company name for fallback/accessibility */}
        <span className="sr-only">{company.name}</span>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4">
            {description}
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 mb-4" />

        {/* Stats Callout */}
        {stats.length > 0 && (
          <StatsGrid stats={stats} />
        )}
      </div>
    </article>
  )
}
