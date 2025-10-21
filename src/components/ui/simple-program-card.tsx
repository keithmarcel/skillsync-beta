'use client'

import { cn } from '@/lib/card-styles'

interface SimpleProgramCardProps {
  id: string
  name: string
  school: {
    name: string
    logo?: string
  }
  programType: string
  format: string
  duration: string
  description: string
  relevanceScore?: number
  className?: string
}

/**
 * Simplified Program Card for Crosswalk Pages
 * Minimal design for HDO/Role detail pages where space is limited
 * Uses same design system as FeaturedProgramCard but with reduced complexity
 */
export function SimpleProgramCard({
  id,
  name,
  school,
  programType,
  format,
  duration,
  description,
  relevanceScore,
  className = ''
}: SimpleProgramCardProps) {
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
        {/* School Logo */}
        {school.logo && (
          <div className="mb-4 h-10 flex items-center">
            <img
              src={school.logo}
              alt={school.name}
              className="h-10 w-auto max-w-[160px] object-contain object-left"
            />
          </div>
        )}

        {/* Program Title */}
        <h3 className="text-[20px] font-bold text-gray-900 leading-tight font-source-sans-pro line-clamp-2 mb-2 hover:text-teal-700 transition-colors duration-300 ease-in-out">
          {name}
        </h3>

        {/* Match Percentage Badge */}
        {relevanceScore && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
              {relevanceScore}% Match
            </span>
          </div>
        )}

        {/* Hidden school name for fallback/accessibility */}
        <span className="sr-only">{school.name}</span>

        {/* Pills Row */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[programType, format, duration].filter(Boolean).map((pill, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
            >
              {pill}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-4" />

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {description}
          </p>
        )}
      </div>
    </article>
  )
}
