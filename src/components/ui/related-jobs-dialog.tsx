'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import Link from 'next/link'

interface JobItem {
  id: string
  title: string
  type: 'occupation' | 'role'
}

interface RelatedJobsDialogProps {
  isOpen: boolean
  onClose: () => void
  program: {
    name: string
    school: {
      name: string
      logo?: string
    }
    relatedJobsCount: number
  }
  occupations: JobItem[]
  roles: JobItem[]
}

function JobListItem({ job }: { job: JobItem }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
        isHovered 
          ? 'bg-[#F0F5FF] border-[#CDDBFE]' 
          : 'bg-[#F3F4F6] border-[#F9FAFB]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={`text-sm transition-all duration-200 ${
        isHovered ? 'font-bold text-[#262626]' : 'font-medium text-[#262626]'
      }`}>
        {job.title}
      </span>
      {isHovered && (
        <Link 
          href={`/${job.type === 'occupation' ? 'occupations' : 'jobs'}/${job.id}`}
          className="flex items-center justify-center px-2.5 py-0.5 bg-[#F9FAFB] rounded-md text-xs font-medium text-[#1C64F2] hover:bg-gray-100 transition-colors"
        >
          Explore
        </Link>
      )}
    </div>
  )
}

export function RelatedJobsDialog({
  isOpen,
  onClose,
  program,
  occupations,
  roles
}: RelatedJobsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0" hideCloseButton={true}>
        {/* Custom header without DialogHeader to avoid double close buttons */}
        <div className="flex items-start justify-between p-6 pb-6">
          <div className="flex flex-col gap-3">
            {program.school.logo ? (
              <div className="flex justify-start">
                <img 
                  src={program.school.logo} 
                  alt={`${program.school.name} logo`}
                  className="h-8 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {program.school.name[0]}
                  </span>
                </div>
              </div>
            )}
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {program.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{program.school.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              This program provides skills for <strong>{program.relatedJobsCount} high demand occupations and roles.</strong>
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-6">
            {occupations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupations</h3>
                <div className="space-y-2">
                  {occupations.map((occupation) => (
                    <JobListItem key={occupation.id} job={occupation} />
                  ))}
                </div>
              </div>
            )}

            {occupations.length > 0 && roles.length > 0 && (
              <hr className="border-gray-200" />
            )}

            {roles.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Roles</h3>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <JobListItem key={role.id} job={role} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
