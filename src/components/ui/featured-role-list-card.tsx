'use client'

import { useState } from 'react'
import { CompanyModal } from './company-modal'
import { transformCompanyProfile } from '@/lib/database/transforms'
import { FeaturedCardActions } from './featured-card-actions'
import { MetaPillsRow, StatsGrid } from './featured-card-base'

interface FeaturedRoleListCardProps {
  id: string
  title: string
  company: {
    name: string
    logo: string
    isTrustedPartner?: boolean
    bio?: string
    headquarters?: string
    revenue?: string
    employees?: string
    industry?: string
  }
  category: string
  jobType: string
  skillsCount: number
  description: string
  medianSalary: number
  requiredProficiency: number
  href?: string
  onAboutCompany?: () => void
  isFavorited: boolean
  onAddFavorite: () => void
  onRemoveFavorite: () => void
  className?: string
}

export function FeaturedRoleListCard({
  id,
  title,
  company,
  category,
  jobType,
  skillsCount,
  description,
  medianSalary,
  requiredProficiency,
  href = '#',
  onAboutCompany,
  isFavorited,
  onAddFavorite,
  onRemoveFavorite,
  className = ''
}: FeaturedRoleListCardProps) {
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)

  const handleAboutCompany = () => {
    setIsCompanyModalOpen(true)
    onAboutCompany?.()
  }

  // Prepare data for reusable components
  const pills = [category, jobType, `${skillsCount} Skills`]
  const stats = [
    { label: "Median Salary", value: `$${medianSalary.toLocaleString()}` },
    { label: "Required Proficiency", value: `${requiredProficiency}%` }
  ]

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${className}`}>
        <div className="p-6">
          {/* Top Row: Title/Company, Badges, Stats, Actions - All in one horizontal line */}
          <div className="flex items-center gap-6 mb-6">
            {/* Title & Company */}
            <div className="flex-shrink-0">
              <a href={href} className="hover:text-teal-700 transition-colors duration-300 ease-in-out">
                <h3 className="text-[20px] font-bold text-gray-900 leading-tight font-source-sans-pro hover:text-teal-700 transition-colors duration-300 ease-in-out">
                  {title}
                </h3>
              </a>
              <p className="text-sm text-gray-500 mt-1">{company.name}</p>
            </div>

            {/* Separator */}
            <div className="h-12 border-l border-dashed border-gray-300"></div>

            {/* Badges - Reusing MetaPillsRow */}
            <MetaPillsRow pills={pills} />

            {/* Separator */}
            <div className="h-12 border-l border-dashed border-gray-300"></div>

            {/* Stats - Reusing StatsGrid with minimal variant */}
            <div className="flex items-center gap-4">
              <StatsGrid stats={stats} variant="minimal" />
            </div>

            {/* Actions Dropdown */}
            <div className="ml-auto">
              <FeaturedCardActions
                entityType="job"
                entityId={id}
                entityTitle={title}
                isFavorited={isFavorited}
                onAddFavorite={onAddFavorite}
                onRemoveFavorite={onRemoveFavorite}
                onViewDetails={() => window.location.href = href}
                onAboutCompany={handleAboutCompany}
              />
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {description}
          </p>

          {/* Separator */}
          <div className="border-t border-gray-200 mb-4"></div>

          {/* Bottom Row: Logo & Explore Button */}
          <div className="flex items-center justify-between">
            {/* Company Logo */}
            <button
              onClick={handleAboutCompany}
              className="hover:opacity-80 transition-opacity"
            >
              <img
                src={company.logo?.startsWith('/') ? company.logo : `/companies/${company.logo}`}
                alt={`${company.name} logo`}
                className="h-6 max-w-[120px] w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/companies/placeholder-logo.svg'
                }}
              />
            </button>

            {/* Explore Button */}
            <a 
              href={href}
              className="flex flex-row justify-center items-center px-4 py-2 gap-2 w-auto h-10 bg-secondary text-teal-800 shadow-sm hover:bg-secondary/80 hover:shadow-md rounded-lg transition-all duration-300 ease-in-out hover:scale-105 transform-gpu backface-visibility-hidden"
            >
              <span className="font-medium text-sm leading-5">
                Explore
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-300 ease-in-out group-hover:translate-x-1 flex-shrink-0">
                <path d="M3.33334 8H12.6667M12.6667 8L8.00001 3.33333M12.6667 8L8.00001 12.6667" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Company Modal */}
      <CompanyModal 
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        company={transformCompanyProfile({
          id: company.name,
          name: company.name,
          logo_url: company.logo?.startsWith('/') ? company.logo : `/companies/${company.logo}`,
          is_trusted_partner: company.isTrustedPartner || false,
          is_published: true,
          company_image_url: null,
          hq_city: null,
          hq_state: null,
          revenue_range: company.revenue || null,
          employee_range: company.employees || null,
          industry: company.industry || null,
          bio: company.bio || null
        })}
      />
    </>
  )
}
