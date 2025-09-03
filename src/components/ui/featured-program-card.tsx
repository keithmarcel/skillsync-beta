import { useState } from 'react'
import { FeaturedProgramCardProps } from '@/lib/card-interfaces'
import { 
  FeaturedCardBase,
  FeaturedCardHeader,
  FeaturedCardContent,
  FeaturedCardFooter,
  FeaturedCardDivider,
  FeaturedCardHeaderLayout,
  MetaPillsRow,
  FeaturedCardDescription,
  ActionButton
} from './featured-card-base'
import { RelatedJobsDialog } from './related-jobs-dialog'

export function FeaturedProgramCard({ 
  id,
  name,
  school,
  programType,
  format,
  duration,
  description,
  skillsCallout,
  href,
  className = ""
}: FeaturedProgramCardProps) {
  const [isRelatedJobsOpen, setIsRelatedJobsOpen] = useState(false)

  // Mock data for related jobs - this would come from database
  const mockOccupations = [
    { id: '1', title: 'Project Management Specialists', type: 'occupation' as const },
    { id: '2', title: 'Operations Manager', type: 'occupation' as const },
    { id: '3', title: 'Business Operations Analyst', type: 'occupation' as const },
    { id: '4', title: 'Process Improvement Specialist', type: 'occupation' as const },
    { id: '5', title: 'Program Operations Coordinator', type: 'occupation' as const }
  ]
  
  const mockRoles = [
    { id: '6', title: 'Mechanical Project Manager', type: 'role' as const },
    { id: '7', title: 'Business Development Manager', type: 'role' as const },
    { id: '8', title: 'Senior Mechanical Project Manager', type: 'role' as const }
  ]

  const handleSeeJobs = () => {
    setIsRelatedJobsOpen(true)
  }
  const schoolLogo = school.logo ? (
    <div className="h-12 flex items-center">
      <img 
        src={school.logo} 
        alt={`${school.name} logo`} 
        className="h-8 w-auto max-w-[140px] object-contain" 
      />
    </div>
  ) : (
    <div className="h-12 flex items-center">
      <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
        <span className="text-xs font-medium text-gray-600">
          {school.name[0]}
        </span>
      </div>
    </div>
  )

  const pills = [programType, format, duration]

  return (
    <FeaturedCardBase className={className}>
      <FeaturedCardHeader>
        <FeaturedCardHeaderLayout
          logo={schoolLogo}
          title={name}
          subtitle={school.name}
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
        {skillsCallout && (
          <div className="flex items-center justify-between p-3 bg-[#F0F5FF] rounded-lg">
            <div className="flex-1">
              <p className="text-[11px] font-semibold leading-4 text-[#1F2A37]">
                {skillsCallout.label}
              </p>
            </div>
            <button 
              onClick={handleSeeJobs}
              className="flex items-center justify-center px-2.5 py-0.5 bg-[#F9FAFB] rounded-md hover:bg-gray-100 transition-colors"
            >
              <span className="text-xs font-medium text-[#1C64F2]">
                See Jobs
              </span>
            </button>
          </div>
        )}
        <FeaturedCardDivider />
      </FeaturedCardContent>

      <FeaturedCardFooter>
        <ActionButton variant="secondary" href={href || "#"}>
          About the School
        </ActionButton>
        <ActionButton variant="primary" href={href || "#"}>
          Program Details
        </ActionButton>
      </FeaturedCardFooter>

      <RelatedJobsDialog
        isOpen={isRelatedJobsOpen}
        onClose={() => setIsRelatedJobsOpen(false)}
        program={{
          name,
          school,
          relatedJobsCount: mockOccupations.length + mockRoles.length
        }}
        occupations={mockOccupations}
        roles={mockRoles}
      />
    </FeaturedCardBase>
  )
}
