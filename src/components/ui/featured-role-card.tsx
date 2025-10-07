'use client'

import { useState } from 'react'
import { FeaturedCardBase, FeaturedCardHeader, FeaturedCardContent, FeaturedCardFooter, FeaturedCardHeaderLayout, MetaPillsRow, FeaturedCardDescription, StatsGrid, ActionButton, TrustedPartnerBadge, FeaturedCardDivider } from './featured-card-base'
import { CompanyModal } from './company-modal'
import { FeaturedCardActions } from './featured-card-actions'
import { transformCompanyProfile } from '@/lib/database/transforms'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './tooltip'

interface FeaturedRoleCardProps {
  id: string
  title: string
  company: {
    name: string
    logo: string
    bio: string
    headquarters: string
    revenue: string
    employees: string
    industry: string
    isTrustedPartner: boolean
  }
  category: string
  jobType: string
  skillsCount: number
  description: string
  medianSalary: number
  requiredProficiency: number
  href: string
  onAboutCompany?: () => void
  className?: string
  isFavorited?: boolean
  onAddFavorite?: () => void
  onRemoveFavorite?: () => void
}

export function FeaturedRoleCard({ 
  id,
  title,
  company,
  category,
  jobType,
  skillsCount,
  description,
  medianSalary,
  requiredProficiency,
  href,
  onAboutCompany,
  className = "",
  isFavorited = false,
  onAddFavorite,
  onRemoveFavorite
}: FeaturedRoleCardProps) {
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)

  const handleAboutCompany = () => {
    setIsCompanyModalOpen(true)
    onAboutCompany?.()
  }

  const handleViewDetails = () => {
    window.location.href = href
  }
  const companyLogo = company.logo ? (
    <div className="h-12 w-[140px] flex items-center justify-center">
      <img 
        src={company.logo.startsWith('/') ? company.logo : `/companies/${company.logo}`} 
        alt={`${company.name} logo`} 
        className="max-h-8 max-w-[140px] w-auto h-auto object-contain" 
        onError={(e) => {
          console.log('Logo failed to load:', company.logo)
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  ) : (
    <div className="h-12 w-[140px] flex items-center justify-center">
      <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
        <span className="text-xs font-medium text-gray-600">
          {company.name[0]}
        </span>
      </div>
    </div>
  )

  const pills = [category, jobType, `${skillsCount} Skills`]
  
  const stats = [
    { label: "Median Salary", value: `$${medianSalary.toLocaleString()}` },
    { label: "Required Proficiency", value: `${requiredProficiency}%` }
  ]

  return (
    <FeaturedCardBase className={`${className} transition-all duration-300 ease-in-out hover:shadow-md will-change-transform`}>
      <FeaturedCardHeader>
        <div className="flex items-start justify-between gap-2">
          {/* Fixed height container for title + company - accommodates 1-2 line titles */}
          <div className="flex-1 h-[72px] flex flex-col justify-center">
            <a href={href} className="hover:text-teal-700 transition-colors duration-300 ease-in-out">
              <h3 className="text-[20px] font-bold text-gray-900 leading-tight font-source-sans-pro line-clamp-2 hover:text-teal-700 transition-colors duration-300 ease-in-out">
                {title}
              </h3>
            </a>
            <p className="text-sm text-gray-500 mt-1">{company.name}</p>
          </div>
          {onAddFavorite && onRemoveFavorite && (
            <FeaturedCardActions
              entityType="job"
              entityId={id}
              entityTitle={title}
              isFavorited={isFavorited}
              onAddFavorite={onAddFavorite}
              onRemoveFavorite={onRemoveFavorite}
              onViewDetails={handleViewDetails}
              onAboutCompany={handleAboutCompany}
            />
          )}
        </div>
        <div className="mt-4">
          <MetaPillsRow pills={pills} />
        </div>
        <FeaturedCardDivider />
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <FeaturedCardDescription>
                  {description}
                </FeaturedCardDescription>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </FeaturedCardHeader>

      <FeaturedCardContent>
        <StatsGrid stats={stats} />
      </FeaturedCardContent>
      
      {/* Company Logo and Button at Bottom */}
      <div className="px-7 pb-6 flex flex-col items-center">
        <div className="w-full max-w-[352px] border-t border-dashed border-gray-300 mt-6 mb-4" />
        <div className="w-full flex items-center justify-between gap-4">
          {/* Clickable Company Logo - Opens About Company Modal */}
          <button 
            onClick={handleAboutCompany}
            className="h-12 w-[140px] flex items-center justify-center hover:opacity-70 transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 transform-gpu backface-visibility-hidden"
          >
            {company.logo ? (
              <img 
                src={company.logo.startsWith('/') ? company.logo : `/companies/${company.logo}`} 
                alt={`${company.name} logo`} 
                className="max-h-8 max-w-[140px] w-auto h-auto object-contain"
                style={{
                  // Reduce Power Design logo by 15% for better visual balance
                  transform: company.name.toLowerCase().includes('power design') ? 'scale(0.85)' : 'none'
                }}
                onError={(e) => {
                  console.log('Logo failed to load:', company.logo)
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {company.name[0]}
                </span>
              </div>
            )}
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

      <CompanyModal 
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        company={transformCompanyProfile({
          id: company.name, // Using name as fallback since we don't have company ID in props
          name: company.name,
          logo_url: company.logo?.startsWith('/') ? company.logo : `/companies/${company.logo}`,
          is_trusted_partner: company.isTrustedPartner,
          is_published: true, // Default to published since this is a featured role
          company_image_url: null, // Not available in current props
          hq_city: null,
          hq_state: null,
          revenue_range: company.revenue || null,
          employee_range: company.employees || null,
          industry: company.industry || null,
          bio: company.bio || null
        })}
      />
    </FeaturedCardBase>
  )
}
