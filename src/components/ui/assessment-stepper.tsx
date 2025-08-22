'use client'

import React from 'react'
import { Check } from 'lucide-react'

export interface StepperStep {
  id: string
  label: string
  status: 'completed' | 'current' | 'upcoming'
  href?: string
}

interface AssessmentStepperProps {
  steps: StepperStep[]
  className?: string
}

export default function AssessmentStepper({ steps, className = '' }: AssessmentStepperProps) {
  return (
    <nav className={`flex items-center justify-center space-x-8 ${className}`} aria-label="Assessment Progress">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {index > 0 && (
            <div className="flex-1 h-px bg-teal-100/30 max-w-16" />
          )}
          <div className="flex flex-col items-center space-y-2">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
              ${step.status === 'completed' 
                ? 'bg-teal-500 border-teal-500 text-white' 
                : step.status === 'current'
                ? 'bg-white border-teal-500 text-teal-500'
                : 'bg-teal-100/20 border-teal-100/40 text-teal-100/60'
              }
            `}>
              {step.status === 'completed' ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <span className={`
              text-xs font-medium whitespace-nowrap
              ${step.status === 'current' 
                ? 'text-white' 
                : step.status === 'completed'
                ? 'text-teal-100'
                : 'text-teal-100/60'
              }
            `}>
              {step.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </nav>
  )
}
