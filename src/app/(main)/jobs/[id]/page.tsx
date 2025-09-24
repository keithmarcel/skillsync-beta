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

// Mock data for fallback - keeping minimal examples
const mockJobData = {
  // Featured Role Example
  '1': {
    id: '1',
    title: 'Mechanical Project Manager',
    job_kind: 'featured_role',
    soc_code: '13-1082',
    category: 'Skilled Trades',
    job_type: 'Full-Time',
    location_city: 'St. Petersburg',
    location_state: 'FL',
    median_wage_usd: 85700,
    education_requirements: 'Construction-related Degree',
    proficiency_score: 90,
    long_desc: "We're looking for a Mechanical Project Manager who is ready to not just manage projects – but live opportunities for future expansion through top tier customer service, quality execution, and project execution. In this role, you'll manage all business aspects of concurrent projects and ensure financial and quality targets are met.",
    featured_image_url: null,
    skills_count: 5,
    company: {
      name: 'Power Design',
      logo_url: null,
      is_trusted_partner: true,
      bio: 'Power Design is a leading electrical contractor specializing in commercial and industrial projects. With over 30 years of experience, we deliver innovative solutions and maintain the highest standards of quality and safety.',
      headquarters: 'St. Petersburg, FL',
      revenue: '500 million to 1 billion USD',
      employees: '1,001 to 5,000',
      industry: 'Construction',
      company_image: null
    },
    job_skills: [
      { skill: { name: 'Process Improvement', category: 'Management' }, weight: 1.0 },
      { skill: { name: 'Project Management', category: 'Management' }, weight: 0.9 },
      { skill: { name: 'Data Analysis', category: 'Analysis' }, weight: 0.8 },
      { skill: { name: 'Strategic Planning', category: 'Planning' }, weight: 0.8 },
      { skill: { name: 'Budgeting', category: 'Finance' }, weight: 0.7 }
    ],
    core_responsibilities: [
      'Manage all business aspects of concurrent projects and ensure financial and quality targets are met',
      'Manage all activities associated with materials, budgeting, and production for assigned projects',
      'Supervise and mentor select assistant project managers on the project team',
      'Actively maintain customer relationships to ensure satisfaction and quality of service',
      'Ensure adherence to Power Design\'s standards of quality, safety, and best practices'
    ]
  },
  // Occupation Example
  'occ-3': {
    id: 'occ-3',
    title: 'Project Management Specialists',
    job_kind: 'occupation',
    soc_code: '13-1082',
    category: 'Business',
    projected_open_positions: 18000,
    education_requirements: "Bachelor's Degree",
    job_growth_outlook: '+8% through 2030',
    median_wage_usd: 86700,
    long_desc: 'Project Management Specialists coordinate and manage projects across various industries to ensure they meet scope, budget and timeline requirements. They serve as a bridge between stakeholders, resources, and teams, driving efficiency and accountability from planning through delivery.',
    featured_image_url: null,
    skills_count: 5,
    job_skills: [
      { skill: { name: 'Process Improvement', category: 'Management' }, weight: 1.0 },
      { skill: { name: 'Project Management', category: 'Management' }, weight: 0.9 },
      { skill: { name: 'Data Analysis', category: 'Analysis' }, weight: 0.8 },
      { skill: { name: 'Strategic Planning', category: 'Planning' }, weight: 0.8 },
      { skill: { name: 'Budgeting', category: 'Finance' }, weight: 0.7 }
    ],
    core_responsibilities: [
      'Analyze and approve business operations to improve efficiency and effectiveness',
      'Identify operational risks and develop strategies to mitigate them',
      'Manage project related correspondence and documents through designated systems',
      'Work closely with various departments to streamline processes and improve outcomes',
      'Use data analysis and metrics to support strategic initiatives and identify opportunities'
    ],
    related_job_titles: [
      'Operations Coordinator',
      'Operations Support Specialist',
      'Business Process Analyst',
      'Process Improvement Specialist'
    ],
    hiring_companies: [
      { name: 'Power Design', logo: null },
      { name: 'TD SYNNEX', logo: null },
      { name: 'Spectrum', logo: null },
      { name: 'BayCare', logo: null }
    ]
  }
}

function CompanyModal({ company }: { company: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">About the Company</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            {company.logo_url && (
              <Image src={company.logo_url} alt={`${company.name} logo`} width={60} height={60} className="rounded" />
            )}
            <div>
              <DialogTitle className="text-xl">{company.name}</DialogTitle>
              <DialogDescription>Learn more about this trusted partner</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          {company.company_image && (
            <Image src={company.company_image} alt={`${company.name}`} width={400} height={200} className="rounded-lg w-full" />
          )}
          <p className="text-gray-700">{company.bio}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Revenue:</strong> {company.revenue_range || 'Not specified'}</div>
            <div><strong>Employees:</strong> {company.employee_range || 'Not specified'}</div>
            <div><strong>Industry:</strong> {company.industry || 'Not specified'}</div>
            <div><strong>Headquarters:</strong> {company.hq_city && company.hq_state ? `${company.hq_city}, ${company.hq_state}` : 'Not specified'}</div>
          </div>
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
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
          label: job.job_kind === 'featured_role' ? 'Featured Roles' : 'High-Demand Occupations', 
          href: `/jobs?tab=${job.job_kind === 'featured_role' ? 'featured-roles' : 'high-demand'}` 
        },
        { label: job.title, isActive: true }
      ]}>
        {/* Company Info for Featured Roles */}
        {job.job_kind === 'featured_role' && job.company && (
          <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-4">
              {job.company.logo_url ? (
                <img 
                  src={job.company.logo_url} 
                  alt={`${job.company.name} logo`}
                  className="h-8 w-auto object-contain"
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
                    <Badge className="bg-teal-500 text-white">{job.category}</Badge>
                    <Badge className="bg-teal-500 text-white">{job.skills?.length || 0} Skills</Badge>
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
                      <svg className="w-2.5 h-2.5 text-[#7EDCE2]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm opacity-80">Median Salary</div>
                      <div className="text-xl font-bold">${job.median_wage_usd?.toLocaleString()}</div>
                    </div>
                  </div>
                  {job.job_kind === 'featured_role' ? (
                    <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-[#7EDCE2]" fill="currentColor" viewBox="0 0 20 20">
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
                        <svg className="w-2.5 h-2.5 text-[#7EDCE2]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm opacity-80">Projected Open Positions in Region</div>
                        <div className="text-xl font-bold">
                          ~{job.projected_open_positions?.toLocaleString() || '18,000'}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20 flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-[#7EDCE2]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm opacity-80">Typical Education Requirements</div>
                      <div className="text-xl font-bold">{job.education_requirements || "Bachelor's Degree"}</div>
                    </div>
                  </div>
                  {job.job_kind === 'featured_role' ? (
                    <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-[#7EDCE2]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm opacity-80">Required Proficiency Score</div>
                        <div className="text-xl font-bold">{job.proficiency_score || '90'}%</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-[#7EDCE2]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm opacity-80">Job Growth Outlook</div>
                        <div className="text-xl font-bold">{job.job_growth_outlook || '+8% through 2030'}</div>
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
        <div className="flex items-center gap-8 mb-12 p-8 bg-white rounded-2xl border">
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
            <Link href={`/assessments/quiz/${job.id}`} className="flex items-center justify-center gap-2">
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
                <div className="border-t border-[#093A4B] mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                  {(job.skills || []).slice(0, 6).map((skill: any, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-teal-400 mt-1">•</span>
                      <span className="text-white text-sm">{skill.skill?.name || skill.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Responsibilities */}
              <div>
                <h3 className="font-semibold mb-4 text-white">Core Responsibilities</h3>
                <div className="border-t border-[#093A4B] mb-4"></div>
                <div className="grid grid-cols-1 gap-3">
                  {(job.core_responsibilities || [
                    'Manage project deliverables and timelines',
                    'Coordinate with stakeholders and team members',
                    'Ensure quality standards are met',
                    'Monitor project budgets and resources',
                    'Communicate progress and issues to leadership'
                  ]).map((responsibility: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-teal-400 mt-1">•</span>
                      <span className="text-white text-sm">{responsibility}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Job Titles (for occupations only) */}
              {job.job_kind === 'occupation' && (
                <div>
                  <h3 className="font-semibold mb-4 text-white">Related Job Titles</h3>
                  <div className="border-t border-[#093A4B] mb-4"></div>
                  <div className="grid grid-cols-2 gap-3">
                    {(job.related_job_titles || [
                      'Operations Coordinator',
                      'Operations Support Specialist', 
                      'Business Process Analyst',
                      'Process Improvement Specialist',
                      'Operations Specialist'
                    ]).map((title: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-teal-400 mt-1">•</span>
                        <span className="text-white text-sm">{title}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
    </div>
  )
}
