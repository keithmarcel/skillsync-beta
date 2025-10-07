'use client'

import { useState, useEffect } from 'react'
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
import { FeaturedCardActions } from './featured-card-actions'
import { RelatedJobsDialog } from './related-jobs-dialog'
import { getRelatedJobsForProgram } from '@/lib/database/queries'
import { GraduationCap } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './tooltip'

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
  className = "",
  isFavorited = false,
  onAddFavorite,
  onRemoveFavorite
}: FeaturedProgramCardProps) {
  const [isRelatedJobsOpen, setIsRelatedJobsOpen] = useState(false)
  const [isAboutSchoolOpen, setIsAboutSchoolOpen] = useState(false)
  const [relatedJobs, setRelatedJobs] = useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)

  const loadRelatedJobs = async () => {
    setLoadingJobs(true)
    try {
      const jobs = await getRelatedJobsForProgram(id)
      setRelatedJobs(jobs)
    } catch (error) {
      console.error('Error loading related jobs:', error)
    } finally {
      setLoadingJobs(false)
    }
  }

  const handleSeeJobs = () => {
    setIsRelatedJobsOpen(true)
    // Load jobs when modal opens
    if (relatedJobs.length === 0) {
      loadRelatedJobs()
    }
  }

  const handleViewDetails = () => {
    window.location.href = `/programs/${id}?from=featured`
  }
  
  const handleAboutSchool = () => {
    setIsAboutSchoolOpen(true)
  }

  const pills = [programType, format, duration]
  return (
    <FeaturedCardBase className={`${className} transition-all duration-300 ease-in-out hover:shadow-md will-change-transform`}>
      <FeaturedCardHeader>
        <div className="flex items-start justify-between gap-2">
          {/* Fixed height container for title + school - accommodates 1-2 line titles */}
          <div className="flex-1 h-[72px] flex flex-col justify-center">
            <a href={href} className="hover:text-teal-700 transition-colors duration-300 ease-in-out">
              <h3 className="text-[20px] font-bold text-gray-900 leading-tight font-source-sans-pro line-clamp-2 hover:text-teal-700 transition-colors duration-300 ease-in-out">
                {name}
              </h3>
            </a>
            <p className="text-sm text-gray-500 mt-1">{school.name}</p>
          </div>
          {onAddFavorite && onRemoveFavorite && (
            <FeaturedCardActions
              entityType="program"
              entityId={id}
              entityTitle={name}
              isFavorited={isFavorited}
              onAddFavorite={onAddFavorite}
              onRemoveFavorite={onRemoveFavorite}
              onViewDetails={handleViewDetails}
              onAboutSchool={handleAboutSchool}
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
      </FeaturedCardContent>
      
      {/* School Logo and Button at Bottom */}
      <div className="px-7 pb-6 flex flex-col items-center">
        <div className="w-full max-w-[352px] border-t border-dashed border-gray-300 mt-6 mb-4" />
        <div className="w-full flex items-center justify-between gap-4">
          {/* Clickable School Logo - Opens About School Modal */}
          <button 
            onClick={handleAboutSchool}
            className="h-12 w-[140px] flex items-center justify-start hover:opacity-70 transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 transform-gpu backface-visibility-hidden"
          >
            {school.logo ? (
              <img 
                src={school.logo} 
                alt={`${school.name} logo`} 
                className="h-10 w-auto max-w-[160px] object-contain object-left" 
              />
            ) : (
              <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {school.name[0]}
                </span>
              </div>
            )}
          </button>
          
          {/* Explore Button */}
          <a 
            href={href}
            className="flex flex-row justify-center items-center px-4 py-2 gap-2 h-10 bg-secondary text-teal-800 shadow-sm hover:bg-secondary/80 hover:shadow-md rounded-lg transition-all duration-300 ease-in-out hover:scale-105 transform-gpu backface-visibility-hidden"
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

      <RelatedJobsDialog
        isOpen={isRelatedJobsOpen}
        onClose={() => setIsRelatedJobsOpen(false)}
        program={{
          name,
          school,
          relatedJobsCount: relatedJobs.length
        }}
        jobs={relatedJobs}
        loading={loadingJobs}
      />

      {/* About School Modal */}
      <Dialog open={isAboutSchoolOpen} onOpenChange={setIsAboutSchoolOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            {school.logo && (
              <div className="flex justify-start mb-4">
                <img 
                  src={school.logo} 
                  alt={`${school.name} logo`}
                  className="h-16 w-auto object-contain max-w-[300px]"
                />
              </div>
            )}
            <DialogTitle className="text-xl">{school.name}</DialogTitle>
            <DialogDescription>
              Learn more about this educational institution
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">About</h4>
              <p className="text-gray-600 text-sm">
                Information about this school will be available soon.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FeaturedCardBase>
  )
}
