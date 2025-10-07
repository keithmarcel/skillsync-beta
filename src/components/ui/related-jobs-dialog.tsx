'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import Link from 'next/link'
import { PageLoader } from '@/components/ui/loading-spinner'

interface Job {
  id: string
  title: string
  job_kind: 'featured_role' | 'occupation'
  soc_code?: string
  company?: {
    name: string
    logo_url?: string
  }
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
  jobs: Job[]
  loading?: boolean
}

function JobListItem({ job }: { job: Job }) {
  const [isHovered, setIsHovered] = useState(false)
  const isFeaturedRole = job.job_kind === 'featured_role'
  
  return (
    <Link 
      href={`/jobs/${job.id}`}
      className={`flex items-center justify-between gap-3 p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
        isHovered 
          ? 'bg-[#F0F5FF] border-[#CDDBFE]' 
          : 'bg-[#F3F4F6] border-[#F9FAFB]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`text-sm transition-all duration-200 truncate ${
          isHovered ? 'font-bold text-[#262626] scale-105' : 'font-medium text-[#262626]'
        } inline-block origin-left`}>
          {job.title}
        </span>
        {isFeaturedRole && (
          <Badge 
            style={{
              backgroundColor: '#ECFDF5',
              color: '#065F46',
              borderRadius: '10px',
              boxShadow: 'none'
            }}
            className="font-medium border-0 text-xs shrink-0"
          >
            Hiring Now
          </Badge>
        )}
      </div>
      <span className={`flex items-center justify-center px-2.5 py-1 bg-white rounded-md text-xs font-medium text-[#1C64F2] border border-[#CDDBFE] shrink-0 transition-opacity duration-200 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        Explore →
      </span>
    </Link>
  )
}

export function RelatedJobsDialog({
  isOpen,
  onClose,
  program,
  jobs,
  loading = false
}: RelatedJobsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 gap-0 max-h-[90vh] overflow-hidden" hideCloseButton={true}>
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

        <div className="px-6 pb-6 space-y-6 overflow-y-auto">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              This program provides skills for <strong>{program.relatedJobsCount} jobs</strong> with overlapping skill requirements.
            </p>
          </div>

          {loading ? (
            <div className="py-8">
              <PageLoader text="Loading related jobs..." />
            </div>
          ) : jobs.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-sm text-gray-600">No related jobs found.</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Jobs ({jobs.length})</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto overflow-x-hidden pr-2">
                {jobs
                  .sort((a, b) => {
                    // Featured roles first, then high-demand occupations
                    if (a.job_kind === 'featured_role' && b.job_kind !== 'featured_role') return -1
                    if (a.job_kind !== 'featured_role' && b.job_kind === 'featured_role') return 1
                    // Within same type, sort alphabetically by title
                    return a.title.localeCompare(b.title)
                  })
                  .map((job) => (
                    <JobListItem key={job.id} job={job} />
                  ))
                }
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
