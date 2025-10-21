'use client'

import { cn } from '@/lib/card-styles'

interface SimpleJobCardProps {
  id: string
  title: string
  company: {
    name: string
    logo?: string
  }
  category?: string
  medianWage?: number
  location?: string
  className?: string
}

/**
 * Simplified Job Card for Crosswalk Pages
 * Minimal design for HDO detail pages showing related Featured Roles
 * Matches SimpleProgramCard design language
 */
export function SimpleJobCard({
  id,
  title,
  company,
  category,
  medianWage,
  location,
  className = ''
}: SimpleJobCardProps) {
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
        <h3 className="text-[20px] font-bold text-gray-900 leading-tight font-source-sans-pro line-clamp-2 mb-2 hover:text-teal-700 transition-colors duration-300 ease-in-out">
          {title}
        </h3>

        {/* Hidden company name for fallback/accessibility */}
        <span className="sr-only">{company.name}</span>

        {/* Company Name (visible) */}
        <p className="text-sm text-gray-600 mb-4">
          {company.name}
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-4" />

        {/* Pills Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Salary Badge */}
          {medianWage && (
            <span className="inline-flex h-[22px] items-center rounded-full px-3 text-xs font-medium bg-teal-100 text-teal-800">
              ${medianWage.toLocaleString()}/year
            </span>
          )}
          
          {/* Category Badge */}
          {category && (
            <span className="inline-flex h-[22px] items-center rounded-full bg-gray-100 px-3 text-xs font-medium text-gray-700">
              {category}
            </span>
          )}

          {/* Location Badge */}
          {location && (
            <span className="inline-flex h-[22px] items-center rounded-full bg-gray-100 px-3 text-xs font-medium text-gray-700">
              {location}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
