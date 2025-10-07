'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/ui/page-header'
import BreadcrumbLayout from '@/components/ui/breadcrumb-layout'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Heart, MapPin, DollarSign, Users, Clock, Upload, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getJobById } from '@/lib/database/queries'
import { useFavorites } from '@/hooks/useFavorites'
import { JobDetailsSkeleton } from '@/components/ui/job-details-skeleton'

// No mock data - using real database data only

function CompanyModal({ company }: { company: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">About the Company</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          {/* Logo displayed prominently - left aligned */}
          {company.logo_url && (
            <div className="flex justify-start mb-4">
              <img 
                src={company.logo_url} 
                alt={`${company.name} logo`}
                className="h-16 w-auto object-contain max-w-[300px]"
              />
            </div>
          )}
          <DialogTitle className="text-xl">{company.name}</DialogTitle>
          <DialogDescription>Learn more about this trusted partner</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Profile/Company Image if available */}
          {company.company_image && (
            <div className="w-full h-48 rounded-lg overflow-hidden">
              <img 
                src={company.company_image} 
                alt={`${company.name} profile`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">About</h4>
            <p className="text-gray-600 text-sm">
              {company.bio || 'Information about this company is not available at this time.'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Revenue</h4>
              <p className="text-sm text-gray-600">{company.revenue_range || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Employees</h4>
              <p className="text-sm text-gray-600">{company.employee_range || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Industry</h4>
              <p className="text-sm text-gray-600">{company.industry || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Headquarters</h4>
              <p className="text-sm text-gray-600">
                {company.hq_city && company.hq_state ? `${company.hq_city}, ${company.hq_state}` : 'Not specified'}
              </p>
            </div>
          </div>
          
          {company.website && (
            <div className="pt-4">
              <Button asChild className="w-full">
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  Visit Company Website
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()

  useEffect(() => {
    async function loadJob() {
      try {
        setLoading(true)
        const jobData = await getJobById(params.id)
        if (jobData) {
          console.log('Job data loaded:', jobData)
          console.log('Company data:', jobData.company)
          console.log('Company logo_url:', jobData.company?.logo_url)
          setJob(jobData)
        } else {
          setError('Job not found')
        }
      } catch (err) {
        console.error('Error loading job:', err)
        setError('Failed to load job details')
      } finally {
        setLoading(false)
      }
    }

    loadJob()
  }, [params.id])

  if (loading) {
    return <JobDetailsSkeleton />
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Job not found'}</p>
          <Button asChild>
            <Link href="/jobs">← Back to Jobs</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        isDynamic={true}
        jobInfo={{
          title: job.title,
          socCode: job.soc_code
        }}
        showPrimaryAction={true}
        showSecondaryAction={false}
        primaryAction={{
          label: isFavorite('job', job.id) ? "Favorited" : "Favorite Occupation",
          variant: "favorite",
          isFavorited: isFavorite('job', job.id),
          onClick: async () => {
            if (isFavorite('job', job.id)) {
              await removeFavorite('job', job.id)
            } else {
              await addFavorite('job', job.id)
            }
          }
        }}
        variant="split"
      />

      <BreadcrumbLayout items={[
        { label: 'Jobs', href: '/jobs' },
        { 
          label: job.job_kind === 'featured_role' ? 'Hiring Now' : 'High-Demand Occupations', 
          href: `/jobs?tab=${job.job_kind === 'featured_role' ? 'featured-roles' : 'high-demand'}` 
        },
        { label: job.title, isActive: true }
      ]}>
        {/* Company Info for Featured Roles */}
        {job.job_kind === 'featured_role' && job.company && (
          <div className="flex items-center justify-between mb-6 p-8 bg-white rounded-lg border">
            <div className="flex items-center gap-4">
              {job.company.logo_url ? (
                <img 
                  src={job.company.logo_url} 
                  alt={`${job.company.name} logo`}
                  className="h-8 w-auto object-contain max-w-[200px]"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-600">
                    {job.company.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{job.title}</span> is an in-demand role at <span className="font-semibold">{job.company.name}</span>.
                </p>
              </div>
            </div>
            <CompanyModal company={job.company} />
          </div>
        )}

        {/* Job Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card className="rounded-2xl bg-[#114B5F] text-white border-0">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white text-xl mb-2">
                      {job.job_kind === 'occupation' ? 'Occupation Overview' : 'Role Overview'}
                    </CardTitle>
                    <CardDescription className="text-white text-lg font-semibold">
                      {job.title}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-[#0F3A47] text-white border-0 hover:bg-[#0F3A47]">{job.category}</Badge>
                    <Badge className="bg-[#0F3A47] text-white border-0 hover:bg-[#0F3A47]">{job.skills?.length || 0} Skills</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-white">
                {/* Divider after title */}
                <div className="border-t border-[#093A4B]"></div>
                
                {/* Description */}
                <div>
                  <p className="text-white leading-relaxed opacity-90">{job.long_desc}</p>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20 flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-[#7EDCE2]" fill="currentColor" viewBox="0 0 20 20" style={{transform: 'translate(0, 0)'}}>
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm opacity-80">Median Salary</div>
                      <div className="text-xl font-bold">${job.median_wage_usd?.toLocaleString()}</div>
                      {job.job_kind === 'occupation' && (
                        <div className="text-xs opacity-70 mt-1">National Average</div>
                      )}
                    </div>
                  </div>
                  {job.job_kind === 'featured_role' ? (
                    <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-[#7EDCE2]" fill="currentColor" viewBox="0 0 20 20" style={{transform: 'translate(0, 0)'}}>
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm opacity-80">Role Location</div>
                        <div className="text-xl font-bold">
                          {job.location_city && job.location_state 
                            ? `${job.location_city}, ${job.location_state}`
                            : 'St. Petersburg, FL'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-[#7EDCE2]" fill="currentColor" viewBox="0 0 20 20" style={{transform: 'translate(0, 0)'}}>
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm opacity-80">Projected Open Positions in Region</div>
                        <div className="text-xl font-bold">
                          {job.projected_open_positions ? `~${job.projected_open_positions.toLocaleString()}` : 'Data not available'}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20 flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-[#7EDCE2]" fill="currentColor" viewBox="0 0 20 20" style={{transform: 'translate(0, 0)'}}>
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm opacity-80">Typical Education Requirements</div>
                      <div className="text-xl font-bold">{job.education_level || job.education_requirements || 'Not specified'}</div>
                    </div>
                  </div>
                  {job.job_kind === 'featured_role' ? (
                    <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-[#7EDCE2]" fill="currentColor" viewBox="0 0 20 20" style={{transform: 'translate(0, 0)'}}>
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm opacity-80">Required Proficiency Score</div>
                        <div className="text-xl font-bold">{job.proficiency_score ? `${job.proficiency_score}%` : 'Not specified'}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-[#7EDCE2]" fill="currentColor" viewBox="0 0 20 20" style={{transform: 'translate(0, 0)'}}>
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm opacity-80">Career Outlook</div>
                        <div className="text-base font-semibold">{job.employment_outlook || 'Data not available'}</div>
                        {job.employment_outlook && (
                          <div className="text-xs opacity-70 mt-1">Based on national data</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Featured Image */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 h-full">
              <Image 
                src={job.featured_image_url || '/assets/hero_occupations.jpg'} 
                alt={job.title} 
                width={400} 
                height={300} 
                className="rounded-2xl w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Unlock this Role Assessment */}
        <div className="flex items-center gap-8 my-12 p-8 bg-white rounded-2xl border">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
            <Image 
              src="/assets/hero_occupations.jpg" 
              alt="Assessment" 
              width={64} 
              height={64} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unlock this Role! Assess your skills to see your role readiness.
            </h3>
            <p className="text-gray-600 text-sm">
              We'll assess your skills, show you how they align with industry benchmarks, and recommend top regional programs that can help close any gaps.
            </p>
          </div>
          <Button asChild className="bg-[#114B5F] hover:bg-[#0F3A47] text-[#FAFAFA] px-3 py-2 rounded-lg flex-shrink-0 shadow-sm w-[215px] h-10 gap-2 font-normal text-base">
            <Link href={`/assessments/${job.id}/intro`} className="flex items-center justify-center gap-2">
              Start Your Assessment
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.33} d="M9 5l7 7-7 7"/>
              </svg>
            </Link>
          </Button>
        </div>

        {/* Skills & Responsibilities */}
        <Card className="rounded-2xl mb-8 bg-[#114B5F] text-white border-0">
          <CardHeader>
            <CardTitle className="text-xl text-white">Skills and Responsibilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Core Skills */}
              <div>
                <h3 className="font-semibold mb-4 text-white">Core Skills</h3>
                <div className="grid grid-cols-2 gap-4">
                  {job.skills && job.skills.length > 0 ? job.skills.slice(0, 6).map((skill: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-teal-400">•</span>
                      <span className="text-white text-sm">{skill.skill?.name || skill.name}</span>
                    </div>
                  )) : (
                    <div className="text-white/70 text-sm">No skills data available</div>
                  )}
                </div>
              </div>

              {/* Divider between sections */}
              <div className="border-t border-[#093A4B]"></div>

              {/* Core Responsibilities */}
              <div>
                <h3 className="font-semibold mb-4 text-white">Core Responsibilities</h3>
                <div className="grid grid-cols-1 gap-3">
                  {job.core_responsibilities && job.core_responsibilities.length > 0 ? job.core_responsibilities.map((responsibility: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-teal-400">•</span>
                      <span className="text-white text-sm">{responsibility}</span>
                    </div>
                  )) : (
                    <div className="text-white/70 text-sm">No responsibilities data available</div>
                  )}
                </div>
              </div>

              {/* Related Job Titles (for occupations only) */}
              {job.job_kind === 'occupation' && (
                <>
                  {/* Bright Outlook Badge */}
                  {job.bright_outlook === 'Bright' && (
                    <>
                      <div className="border-t border-[#093A4B]"></div>
                      <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 flex items-start gap-3">
                        <div className="text-yellow-400 flex-shrink-0">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-yellow-100 mb-1">Bright Outlook Occupation</div>
                          <div className="text-sm text-yellow-200">{job.bright_outlook_category}</div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Typical Tasks Section */}
                  {job.tasks && job.tasks.length > 0 && (
                    <>
                      <div className="border-t border-[#093A4B]"></div>
                      <div>
                        <h3 className="font-semibold mb-4 text-white">Typical Tasks & Responsibilities</h3>
                        <div className="text-sm text-white/70 mb-3">Day-to-day activities in this occupation</div>
                        <div className="space-y-3">
                          {job.tasks.slice(0, 8).map((task: any, index: number) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-semibold text-teal-300">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-white/90 text-sm leading-relaxed">{task.TaskDescription}</p>
                                {task.DataValue && (
                                  <span className="text-xs text-white/50 mt-1 inline-block">Importance: {task.DataValue}/5.0</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Tools & Technology Section */}
                  {job.tools_and_technology && job.tools_and_technology.length > 0 && (
                    <>
                      <div className="border-t border-[#093A4B]"></div>
                      <div>
                        <h3 className="font-semibold mb-4 text-white">Tools & Technology</h3>
                        <div className="text-sm text-white/70 mb-3">Software and equipment commonly used</div>
                        <div className="grid grid-cols-2 gap-3">
                          {job.tools_and_technology.slice(0, 12).map((tool: any, index: number) => (
                            <div key={index} className="bg-[#0F3A47] rounded-lg p-3 border border-teal-500/20">
                              <div className="text-sm font-medium text-white">
                                {tool.ToolName || tool.TechnologyName}
                              </div>
                              {tool.Category && (
                                <div className="text-xs text-white/50 mt-1">{tool.Category}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* CareerOneStop Video */}
                  {job.video_url && (
                    <>
                      <div className="border-t border-[#093A4B]"></div>
                      <div>
                        <h3 className="font-semibold mb-4 text-white">Career Video</h3>
                        <a 
                          href={job.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-medium transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                          </svg>
                          Watch Career Video on CareerOneStop
                        </a>
                      </div>
                    </>
                  )}

                  {/* Divider between sections */}
                  <div className="border-t border-[#093A4B]"></div>
                  
                  <div>
                    <h3 className="font-semibold mb-4 text-white">Related Job Titles</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {job.related_job_titles && job.related_job_titles.length > 0 ? job.related_job_titles.map((title: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-teal-400">•</span>
                          <span className="text-white text-sm">{title}</span>
                        </div>
                      )) : (
                        <div className="text-white/70 text-sm col-span-2">No related titles available</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hiring Companies for Occupations */}
        {job.job_kind === 'occupation' && (
          <Card className="rounded-2xl mb-16">
            <CardHeader className="pb-5">
              <CardTitle className="text-xl">Trusted Partners in your area are hiring for this occupation</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="flex items-center justify-start gap-8">
                {[
                  { name: 'Power Design', logo: '/companies/power-design.svg' },
                  { name: 'TD SYNNEX', logo: '/companies/td-synnexx.svg' },
                  { name: 'Spectrum', logo: '/companies/spectrum.svg' },
                  { name: 'BayCare', logo: '/companies/Baycare.svg' }
                ].map((company, index) => (
                  <div key={index} className="flex items-center gap-3 text-gray-700">
                    <img 
                      src={company.logo} 
                      alt={`${company.name} logo`}
                      className="h-6 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </BreadcrumbLayout>
      
      {/* Extra bottom padding for featured roles */}
      {job.job_kind === 'featured_role' && <div className="pb-16"></div>}
    </div>
  )
}
