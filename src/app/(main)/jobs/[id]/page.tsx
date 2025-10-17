'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/ui/page-header'
import BreadcrumbLayout from '@/components/ui/breadcrumb-layout'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Heart, MapPin, DollarSign, Users, Clock, Upload, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getJobById } from '@/lib/database/queries'
import { useFavorites } from '@/hooks/useFavorites'
import { useRoleView } from '@/hooks/useRoleView'
import { JobDetailsSkeleton } from '@/components/ui/job-details-skeleton'
import { supabase } from '@/lib/supabase/client'
import { FeaturedProgramCard } from '@/components/ui/featured-program-card'

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

// Helper function to remove regional indicators like (National), (Regional), etc.
const cleanRegionalIndicators = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.replace(/\s*\((National|Regional|State|Local)\)/gi, '').trim();
}

// Helper function to ensure array fields are properly parsed
const ensureArray = (field: any): any[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllPrograms, setShowAllPrograms] = useState(false)
  const [recommendedPrograms, setRecommendedPrograms] = useState<any[]>([])
  const [quizId, setQuizId] = useState<string | null>(null)
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()
  
  // Track role view
  useRoleView(params.id)

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
          
          // Load recommended programs from crosswalk
          const { data: crosswalk } = await supabase
            .from('role_program_crosswalk')
            .select(`
              confidence_score,
              match_reasoning,
              program:programs(
                id,
                name,
                discipline,
                program_type,
                short_desc,
                duration_text,
                format,
                school:schools(name, logo_url)
              )
            `)
            .eq('job_id', params.id)
            .order('confidence_score', { ascending: false })
            .limit(6)
          
          if (crosswalk) {
            setRecommendedPrograms(crosswalk)
            console.log('Recommended programs loaded:', crosswalk.length)
          }
          
          // Load quiz for this job (if exists)
          const { data: quiz } = await supabase
            .from('quizzes')
            .select('id')
            .eq('job_id', params.id)
            .eq('status', 'published')
            .single()
          
          if (quiz) {
            setQuizId(quiz.id)
            console.log('Quiz found for job:', quiz.id)
          } else {
            console.log('No quiz found for job')
          }
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
          socCode: job.job_kind === 'featured_role' && job.company?.name ? job.company.name : job.soc_code
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 lg:items-stretch">
          <div className="lg:col-span-2 flex">
            <Card className="rounded-2xl bg-[#114B5F] text-white border-0 w-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white text-xl mb-2">
                      {job.job_kind === 'occupation' ? 'Occupation Overview' : 'Role Overview'}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-[#0F3A47] text-white border-0 hover:bg-[#0F3A47]">{job.category}</Badge>
                    <Badge className="bg-[#0F3A47] text-white border-0 hover:bg-[#0F3A47]">{job.skills?.length || 0} Skills</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-white px-8 pb-8 pt-0">
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
                      <div className="text-xs opacity-70 mt-1">
                        {job.wage_area_name || 'Tampa Bay Area'}
                      </div>
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
                        <div className="text-sm opacity-80">Role Type</div>
                        <div className="text-xl font-bold">
                          {job.job_type || 'Full-Time'}
                          {(job as any).work_location_type && `, ${(job as any).work_location_type}`}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
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
                        <div className="text-sm opacity-80">Current Employment</div>
                        <div className="text-xl font-bold">
                          {(job as any).employment_level
                            ? `~${(job as any).employment_level.toLocaleString()}`
                            : job.bls_employment_projections?.[0]?.employment_2022 
                            ? `~${job.bls_employment_projections[0].employment_2022.toLocaleString()}` 
                            : 'Data Not Available'}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {(job as any).wage_area_name 
                            ? `Workers in ${(job as any).wage_area_name.replace('Tampa-St. Petersburg-Clearwater, FL', 'Tampa Bay Area')} (${(job as any).wage_data_year || 2024})`
                            : 'Workers Nationally (2022)'}
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
                      <div className="text-sm opacity-80">Education Requirements</div>
                      <div className="text-xl font-bold">{cleanRegionalIndicators(job.education_level || job.education_requirements) || 'Not Specified'}</div>
                      <div className="text-xs opacity-70 mt-1">For this Role</div>
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
                        <div className="text-xl font-bold">{job.required_proficiency_pct ? `${job.required_proficiency_pct}%` : 'Not specified'}</div>
                        <div className="text-xs opacity-70 mt-1">On Assessment</div>
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
                        <div className="text-sm opacity-80">
                          {(job as any).wage_area_name ? 'Regional Career Outlook' : 'National Career Outlook'}
                        </div>
                        {job.employment_outlook ? (
                          <>
                            <div className={`text-xl font-bold ${
                              job.employment_outlook.toLowerCase().includes('bright') || job.employment_outlook.toLowerCase().includes('faster') 
                                ? 'text-green-400' 
                                : job.employment_outlook.toLowerCase().includes('average') || job.employment_outlook.toLowerCase().includes('as fast')
                                ? 'text-yellow-400'
                                : 'text-orange-400'
                            }`}>
                              {cleanRegionalIndicators(job.employment_outlook)}
                            </div>
                            <div className="text-xs opacity-70 mt-1">Through 2032</div>
                          </>
                        ) : (
                          <div className="text-xl font-bold">Data Not Available</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Featured Image */}
          <div className="lg:col-span-1 flex">
            <div className="sticky top-8 w-full min-h-[400px] rounded-2xl overflow-hidden">
              <Image 
                src={job.featured_image_url || '/assets/hero_occupations.jpg'} 
                alt={job.title} 
                width={800} 
                height={600} 
                className="w-full h-full object-cover object-center"
                priority
                quality={95}
              />
            </div>
          </div>
        </div>

        {/* Employers Hiring Now - Only for Occupations */}
        {job.job_kind === 'occupation' && (
          <div id="open-roles" className="my-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#0694A2] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Local Employers Hiring Now
                </h3>
                {/* TODO: Replace with real crosswalk data - show subhead when data exists */}
                <p className="text-gray-500 text-sm mt-2">
                  No active roles currently match this occupation. Check back soon for new opportunities from trusted employers in your area.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Separator */}
        {job.job_kind === 'occupation' && (
          <hr className="my-12 border-gray-200" />
        )}

        {/* Education & Training Programs - For Occupations (before skills) */}
        {job.job_kind === 'occupation' && (
          <div id="programs" className="my-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#0694A2] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Relevant Education & Training Programs
                </h3>
                {/* TODO: Replace with real skill overlap data - show subhead when data exists */}
                <p className="text-gray-500 text-sm mt-2">
                  No matching programs are currently available in your region. We're continuously adding new education partners and training opportunities.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Skills Assessment Card - Featured Roles Only */}
        {job.job_kind === 'featured_role' && (
          <div className="flex items-center gap-8 mb-12 p-8 bg-white rounded-2xl border">
            <div className="w-16 h-16 rounded-full bg-[#0694A2] flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Assess Your Skills & Get Invited to Apply at {job.company?.name}
              </h3>
              <p className="text-gray-600 text-sm">
                Take a quick skills assessment to see how you match this role. You'll receive a detailed readiness score, personalized skill gap analysis, and tailored program recommendations to help you succeed. {' '}
                <Link href="/account-settings" className="text-[#0694A2] hover:text-[#057A85] font-medium inline-flex items-center gap-1">
                  Enable job invitations in your profile →
                </Link>
              </p>
            </div>
            {quizId ? (
              <Button asChild className="bg-[#0694A2] hover:bg-[#057A85] text-white px-6 py-3 rounded-lg flex-shrink-0">
                <Link href={`/assessments/quiz/${quizId}`}>
                  Start Assessment →
                </Link>
              </Button>
            ) : (
              <Button disabled className="bg-gray-400 text-white px-6 py-3 rounded-lg flex-shrink-0 cursor-not-allowed">
                Assessment Coming Soon
              </Button>
            )}
          </div>
        )}

        {/* Skills & Responsibilities */}
        <Card className="rounded-2xl mb-8 bg-[#114B5F] text-white border-0">
          <CardHeader>
            <CardTitle className="text-xl text-white">Skills and Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-0">
            <div className="space-y-8">
              {/* Core Skills */}
              <div>
                <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Core Skills
                </h3>
                <TooltipProvider>
                  <div className="flex flex-wrap gap-2">
                    {job.skills && job.skills.length > 0 ? job.skills.map((skill: any, index: number) => {
                      const skillData = skill.skill || skill.skills || skill;
                      return (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-[#CCFBF1] text-[#0D5B52] font-semibold cursor-help">
                              {skillData.name}
                            </span>
                          </TooltipTrigger>
                          {skillData.description && (
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">{skillData.description}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    }) : (
                      <div className="text-white/70 text-sm">No skills data available</div>
                    )}
                  </div>
                </TooltipProvider>
              </div>

              {/* Divider between sections */}
              <div className="border-t border-[#093A4B]"></div>

              {/* Core Responsibilities */}
              <div>
                <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Core Responsibilities
                </h3>
                {(() => {
                  // Handle both array and JSON string formats
                  let responsibilities = job.core_responsibilities;
                  if (typeof responsibilities === 'string') {
                    try {
                      responsibilities = JSON.parse(responsibilities);
                    } catch (e) {
                      responsibilities = null;
                    }
                  }
                  
                  return responsibilities && Array.isArray(responsibilities) && responsibilities.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {responsibilities.map((responsibility: string, index: number) => (
                        <div key={index} className="bg-[#0F3A47] rounded-lg p-4 border border-teal-500/20 transition-all duration-150 hover:scale-[1.02] hover:border-teal-400/40 hover:shadow-lg hover:shadow-teal-500/10 cursor-default">
                          <span className="text-white text-sm">{responsibility}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/70 text-sm">No responsibilities data available</div>
                  );
                })()}
              </div>

              {/* Typical Tasks Section - Show for both occupations and featured roles */}
              {job.tasks && job.tasks.length > 0 && (
                <>
                  <div className="border-t border-[#093A4B]"></div>
                  <div>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Day-to-Day Tasks
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(() => {
                        // Handle both old format (TaskDescription) and new format (task)
                        const taskText = (task: any) => task.TaskDescription || task.task || task;
                        const tasksArray = ensureArray(job.tasks);
                        const uniqueTasks = tasksArray.filter((task: any, index: number, self: any[]) => 
                          index === self.findIndex((t: any) => taskText(t) === taskText(task))
                        );
                        return uniqueTasks.slice(0, 8).map((task: any, index: number) => (
                          <div key={index} className="bg-[#0F3A47] rounded-lg p-4 border border-teal-500/20 transition-all duration-150 hover:scale-[1.02] hover:border-teal-400/40 hover:shadow-lg hover:shadow-teal-500/10 cursor-default">
                            <span className="text-white text-sm">{taskText(task)}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </>
              )}

              {/* Tools & Technology Section - Show for both occupations and featured roles */}
              {job.tools_and_technology && job.tools_and_technology.length > 0 && (
                <>
                  <div className="border-t border-[#093A4B]"></div>
                  <div>
                    <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Commonly Used Tools & Technology
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {job.tools_and_technology.slice(0, 12).map((tool: any, index: number) => {
                        // Handle both old format (ToolName/TechnologyName) and new format (name)
                        const toolName = tool.ToolName || tool.TechnologyName || tool.name || tool;
                        const category = tool.Category || tool.category;
                        return (
                          <div key={index} className="bg-[#0F3A47] rounded-lg p-3 border border-teal-500/20 transition-all duration-150 hover:scale-[1.02] hover:border-teal-400/40 hover:shadow-lg hover:shadow-teal-500/10 cursor-default">
                            <div className="text-sm font-medium text-white">
                              {toolName}
                            </div>
                            {category && (
                              <div className="text-xs text-white/50 mt-1">{category}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Education & Training Programs - For Featured Roles Only (after skills) */}
        {job.job_kind === 'featured_role' && (
          <div id="programs" className="my-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#0694A2] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Relevant Education & Training Programs
                </h3>
                <p className="text-gray-500 text-sm mt-2">
                  {recommendedPrograms.length > 0 
                    ? "Programs that align with the skills and requirements for this role."
                    : "No matching programs are currently available in your region. We're continuously adding new education partners and training opportunities."}
                </p>
              </div>
            </div>

            {recommendedPrograms.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedPrograms.map((rec: any, index: number) => (
                  <FeaturedProgramCard
                    key={index}
                    id={rec.program.id}
                    name={rec.program.name}
                    school={{
                      name: rec.program.school?.name || 'School',
                      logo: rec.program.school?.logo_url || null
                    }}
                    programType={rec.program.program_type || 'Certificate'}
                    format={rec.program.format || 'Online'}
                    duration={rec.program.duration_text || 'Self-paced'}
                    description={rec.program.short_desc || rec.match_reasoning || 'Recommended program for this role'}
                    skillsCallout={undefined}
                    href={`/programs/${rec.program.id}`}
                    isFavorited={false}
                    onAddFavorite={() => {}}
                    onRemoveFavorite={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Data Source Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Data sources:{' '}
            {job.job_kind === 'featured_role' && job.company?.name && (
              <>
                {job.company.name}
                {', '}
              </>
            )}
            {job.job_kind === 'occupation' && (
              <>
                <a href="https://www.bls.gov/" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline">
                  BLS 2024
                </a>
                {'; '}
              </>
            )}
            <a href="https://www.careeronestop.org/" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline">
              CareerOneStop
            </a>
            {'; '}
            <a href="https://www.onetonline.org/" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline">
              O*NET
            </a>
          </p>
        </div>
      </BreadcrumbLayout>
      
      {/* Extra bottom padding for featured roles */}
      {job.job_kind === 'featured_role' && <div className="pb-16"></div>}
    </div>
  )
}
