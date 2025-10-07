import React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, DollarSign, Target } from 'lucide-react'
import Image from 'next/image'

interface FeaturedJobCardV2Props {
  id: string
  title: string
  category?: string
  jobType?: string
  skillsCount?: number
  description: string
  medianSalary?: number
  requiredProficiency?: number
  companyName?: string
  companyLogo?: string
  detailsHref: string
  className?: string
}

export function FeaturedJobCardV2({
  id,
  title,
  category,
  jobType,
  skillsCount,
  description,
  medianSalary,
  requiredProficiency,
  companyName,
  companyLogo,
  detailsHref,
  className = ''
}: FeaturedJobCardV2Props) {
  return (
    <div 
      className={`
        bg-white rounded-2xl border border-gray-200 
        p-6 hover:shadow-lg transition-shadow duration-200
        flex flex-col h-full
        ${className}
      `}
    >
      {/* Header - Job Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
        {title}
      </h3>

      {/* Badges Row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {category && (
          <Badge 
            variant="secondary" 
            className="bg-gray-100 text-gray-700 hover:bg-gray-100 font-normal"
          >
            {category}
          </Badge>
        )}
        {jobType && (
          <Badge 
            variant="secondary" 
            className="bg-gray-100 text-gray-700 hover:bg-gray-100 font-normal"
          >
            {jobType}
          </Badge>
        )}
        {skillsCount !== undefined && (
          <Badge 
            variant="secondary" 
            className="bg-gray-100 text-gray-700 hover:bg-gray-100 font-normal"
          >
            {skillsCount} Skills
          </Badge>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 mb-4" />

      {/* Description */}
      <p className="text-sm text-gray-600 mb-6 line-clamp-2 flex-grow">
        {description}
      </p>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Median Salary */}
        {medianSalary && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <span className="text-xs text-gray-600">Median Salary</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              ${medianSalary.toLocaleString()}
            </p>
          </div>
        )}

        {/* Required Proficiency */}
        {requiredProficiency !== undefined && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <span className="text-xs text-gray-600">Required Proficiency</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {requiredProficiency}%
            </p>
          </div>
        )}
      </div>

      {/* Job Details Button */}
      <Link href={detailsHref} className="block mb-6">
        <Button 
          className="w-full bg-[#BFEEF4] hover:bg-[#A5E8EF] text-[#114B5F] font-semibold rounded-lg h-12"
        >
          Job Details
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>

      {/* Company Logo */}
      {companyLogo && companyName && (
        <div className="flex justify-center pt-4 border-t border-gray-100">
          <div className="relative h-12 w-auto max-w-[200px]">
            <Image
              src={companyLogo}
              alt={companyName}
              width={200}
              height={48}
              className="object-contain"
              style={{ maxHeight: '48px', width: 'auto' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
