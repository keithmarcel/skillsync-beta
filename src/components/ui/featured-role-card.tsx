'use client'

import { useState } from 'react'
import { FeaturedCardBase, FeaturedCardHeader, FeaturedCardContent, FeaturedCardFooter, FeaturedCardHeaderLayout, MetaPillsRow, FeaturedCardDescription, StatsGrid, ActionButton, TrustedPartnerBadge, FeaturedCardDivider } from './featured-card-base'
import { CompanyModal } from './company-modal'
import { FeaturedCardActions } from './featured-card-actions'
import { transformCompanyProfile } from '@/lib/database/transforms'

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
    <div className="h-12 flex items-center">
      <img 
        src={`/companies/${company.logo}`} 
        alt={`${company.name} logo`} 
        className="h-8 w-auto max-w-[140px] object-contain" 
        onError={(e) => {
          console.log('Logo failed to load:', `/companies/${company.logo}`)
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  ) : (
    <div className="h-12 flex items-center">
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
    <FeaturedCardBase className={className}>
      <FeaturedCardHeader>
        <FeaturedCardHeaderLayout
          badge={company.isTrustedPartner ? <TrustedPartnerBadge /> : undefined}
          logo={companyLogo}
          title={title}
          actionsMenu={
            onAddFavorite && onRemoveFavorite ? (
              <FeaturedCardActions
                entityType="job"
                entityId={id}
                entityTitle={title}
                isFavorited={isFavorited}
                onAddFavorite={onAddFavorite}
                onRemoveFavorite={onRemoveFavorite}
                onViewDetails={handleViewDetails}
              />
            ) : undefined
          }
        />
        <div className="mt-4">
          <MetaPillsRow pills={pills} />
        </div>
        <FeaturedCardDivider />
        <FeaturedCardDescription>
          {description}
        </FeaturedCardDescription>
      </FeaturedCardHeader>

      <FeaturedCardContent>
        <StatsGrid stats={stats} />
        <FeaturedCardDivider />
      </FeaturedCardContent>

      <FeaturedCardFooter>
        <ActionButton variant="secondary" onClick={handleAboutCompany}>
          About the Company
        </ActionButton>
        <ActionButton variant="primary" href={href}>
          Job Details
        </ActionButton>
      </FeaturedCardFooter>

      <CompanyModal 
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        company={transformCompanyProfile({
          id: company.name, // Using name as fallback since we don't have company ID in props
          name: company.name,
          logo_url: company.logo,
          is_trusted_partner: company.isTrustedPartner,
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
