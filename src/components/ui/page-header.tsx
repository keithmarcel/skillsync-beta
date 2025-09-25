'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Breadcrumb, { BreadcrumbItem } from './breadcrumb'
import AssessmentStepper, { StepperStep } from './assessment-stepper'

interface PageHeaderProps {
  title?: string
  subtitle?: string
  primaryAction?: {
    label: string
    href?: string
    onClick?: () => void
    variant?: 'default' | 'outline' | 'favorite'
    isFavorited?: boolean
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
    variant?: 'default' | 'outline'
  }
  variant?: 'default' | 'centered' | 'split'
  isDynamic?: boolean
  userName?: string
  isReturningUser?: boolean
  showPrimaryAction?: boolean
  showSecondaryAction?: boolean
  // Dynamic content props
  programInfo?: {
    name: string
    school: string
    location: string
  }
  jobInfo?: {
    title: string
    socCode?: string
    company?: string
  }
  breadcrumbs?: BreadcrumbItem[]
  assessmentSteps?: StepperStep[]
}

export default function PageHeader({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  showPrimaryAction = false,
  showSecondaryAction = false,
  variant = 'default',
  isDynamic = false,
  userName,
  isReturningUser,
  programInfo,
  jobInfo,
  breadcrumbs,
  assessmentSteps
}: PageHeaderProps) {
  
  const { toast } = useToast()
  
  // Generate dynamic content based on context
  const getDynamicTitle = () => {
    if (!isDynamic) return title
    
    if (jobInfo) {
      return jobInfo.title
    }
    
    return title || "Welcome!"
  }
  
  const getDynamicSubtitle = () => {
    if (!isDynamic) return subtitle
    
    if (jobInfo) {
      let sub = ''
      if (jobInfo.socCode) sub += `SOC Code: ${jobInfo.socCode}`
      if (jobInfo.company) sub += sub ? ` • ${jobInfo.company}` : jobInfo.company
      return sub
    }
    
    return subtitle || "Track your progress and take your next step toward career readiness."
  }

  // Handle favorite toggle with toast
  const handleFavoriteToggle = (currentFavorited: boolean, jobTitle?: string) => {
    if (primaryAction?.onClick) {
      primaryAction.onClick()
    }
    
    // Show toast message
    const message = currentFavorited 
      ? `Removed ${jobTitle || 'job'} from favorites`
      : `Added ${jobTitle || 'job'} to favorites`
    
    toast({
      title: currentFavorited ? "Removed from favorites" : "Added to favorites",
      description: message,
    })
  }
  
  const dynamicTitle = getDynamicTitle()
  const dynamicSubtitle = getDynamicSubtitle()
  
  if (variant === 'split') {
    return (
      <div className="bg-[#114B5F] py-12 mt-4">
        <div className="max-w-[1280px] mx-auto px-6 flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-white font-bold text-[30px] leading-[36px]">
              {dynamicTitle}
            </h1>
            {dynamicSubtitle && (
              <p className="text-teal-50 text-base font-normal">
                {dynamicSubtitle}
              </p>
            )}
          </div>
          {(primaryAction || secondaryAction) && (
            <div className="flex items-center gap-4">
              {primaryAction && showPrimaryAction && (
                <>
                  {primaryAction.href ? (
                    <Button 
                      asChild
                      variant="outline"
                      className="flex h-9 px-3 py-2 justify-center items-center gap-2 rounded-lg border border-[#D5F5F6] bg-transparent text-[#D5F5F6] hover:bg-teal-500 hover:text-white"
                    >
                      <Link href={primaryAction.href}>{primaryAction.label}</Link>
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (primaryAction.variant === 'favorite') {
                          handleFavoriteToggle(primaryAction.isFavorited || false, dynamicTitle)
                        } else if (primaryAction.onClick) {
                          primaryAction.onClick()
                        }
                      }}
                      className={`flex h-9 px-3 py-2 justify-center items-center gap-2 rounded-lg border ${
                        primaryAction.variant === 'favorite'
                          ? 'border-[#D5F5F6] bg-transparent text-[#D5F5F6] hover:border-[#0694A2] hover:text-[#0694A2]'
                          : 'border-[#D5F5F6] bg-transparent text-[#D5F5F6] hover:bg-teal-500 hover:text-white'
                      }`}
                    >
                      {primaryAction.label}
                      {primaryAction.variant === 'favorite' && (
                        <Heart className={`w-4 h-4 ${primaryAction.isFavorited ? 'fill-[#0694A2] text-[#0694A2]' : 'hover:fill-[#0694A2]'}`} />
                      )}
                    </Button>
                  )}
                </>
              )}
              {secondaryAction && showSecondaryAction && (
                <Button 
                  variant="outline"
                  className="flex h-9 px-3 py-2 justify-center items-center gap-2 rounded-lg border border-[#D5F5F6] bg-transparent text-[#D5F5F6] hover:bg-teal-500 hover:text-white"
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const containerClasses = variant === 'centered' 
    ? "flex justify-center items-center bg-[#114B5F] py-8"
    : "bg-[#114B5F] py-8"

  const contentClasses = variant === 'centered'
    ? "flex flex-col items-center gap-6 max-w-[1280px] px-6 text-center"
    : "max-w-[1280px] mx-auto px-6"

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        <h1 className="text-white font-bold text-[30px] leading-[36px]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-teal-50 text-base font-normal">
            {subtitle}
          </p>
        )}
        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-4">
            {primaryAction && showPrimaryAction && (
              <>
                {primaryAction.href ? (
                  <Button 
                    asChild
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
                  >
                    <Link href={primaryAction.href}>{primaryAction.label}</Link>
                  </Button>
                ) : (
                  <Button 
                    onClick={primaryAction.onClick}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
                  >
                    {primaryAction.label}
                    {primaryAction.variant === 'favorite' && (
                      <Heart className={`w-4 h-4 ${primaryAction.isFavorited ? 'fill-current' : ''}`} />
                    )}
                  </Button>
                )}
              </>
            )}
            {secondaryAction && showSecondaryAction && (
              <>
                {secondaryAction.href ? (
                  <Button 
                    asChild
                    variant="outline"
                    className="border border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100 px-4 py-2 rounded-lg"
                  >
                    <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={secondaryAction.onClick}
                    className="border border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100 px-4 py-2 rounded-lg"
                  >
                    {secondaryAction.label}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
