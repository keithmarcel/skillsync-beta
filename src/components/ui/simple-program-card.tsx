'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

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
    <Card className={`h-full hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}>
      <CardContent className="p-5">
        {/* School Logo */}
        {school.logo && (
          <div className="mb-3 h-10 flex items-center">
            <Image
              src={school.logo}
              alt={school.name}
              width={120}
              height={40}
              className="max-h-10 w-auto object-contain"
            />
          </div>
        )}

        {/* Program Title */}
        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
          {name}
        </h3>

        {/* Match Percentage Badge */}
        {relevanceScore && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
              {relevanceScore}% Match
            </span>
          </div>
        )}

        {/* Hidden school name for fallback/accessibility */}
        <span className="sr-only">{school.name}</span>

        {/* Pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {[programType, format, duration].filter(Boolean).map((pill, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
            >
              {pill}
            </span>
          ))}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
