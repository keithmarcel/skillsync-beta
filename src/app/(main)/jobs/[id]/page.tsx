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
                    <Badge className="bg-teal-500 text-white hover:bg-teal-600">{job.category}</Badge>
                    <Badge className="bg-teal-500 text-white hover:bg-teal-600">{job.skills?.length || 0} Skills</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-white">
                {/* Description */}
                <div>
                  <p className="text-white leading-relaxed opacity-90">{job.long_desc}</p>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20">
                    <div className="text-sm opacity-80">Median Salary</div>
                    <div className="text-xl font-bold">${job.median_wage_usd?.toLocaleString()}</div>
                  </div>
                  {job.job_kind === 'featured_role' ? (
                    <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20">
                      <div className="text-sm opacity-80">Role Location</div>
                      <div className="text-xl font-bold">
                        {job.location_city && job.location_state 
                          ? `${job.location_city}, ${job.location_state}`
                          : 'St. Petersburg, FL'}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20">
                      <div className="text-sm opacity-80">Projected Open Positions in Region</div>
                      <div className="text-xl font-bold">
                        ~{job.projected_open_positions?.toLocaleString() || '18,000'}
                      </div>
                    </div>
                  )}
                  <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20">
                    <div className="text-sm opacity-80">Typical Education Requirements</div>
                    <div className="text-xl font-bold">{job.education_requirements || "Bachelor's Degree"}</div>
                  </div>
                  {job.job_kind === 'featured_role' ? (
                    <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20">
                      <div className="text-sm opacity-80">Required Proficiency Score</div>
                      <div className="text-xl font-bold">{job.proficiency_score || '90'}%</div>
                    </div>
                  ) : (
                    <div className="bg-[#0F3A47] text-white p-4 rounded-lg border border-teal-500/20">
                      <div className="text-sm opacity-80">Job Growth Outlook</div>
                      <div className="text-xl font-bold">{job.job_growth_outlook || '+8% through 2030'}</div>
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
          <Button asChild className="bg-[#0694A2] hover:bg-[#057A85] text-white px-6 py-3 rounded-lg flex-shrink-0">
            <Link href={`/assessments/quiz/${job.id}`}>
              Start Your Assessment →
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
                <div className="flex flex-wrap gap-2 mb-6">
                  {job.skills?.map((jobSkill: any, index: number) => (
                    <Badge key={index} className="bg-teal-500 text-white hover:bg-teal-600 border-0">
                      {jobSkill.skill?.name || 'Unknown Skill'}
                    </Badge>
                  )) || [
                    'Process Improvement', 'Project Management', 'Data Analysis', 'Strategic Planning', 'Budgeting'
                  ].map((skill, index) => (
                    <Badge key={index} className="bg-teal-500 text-white hover:bg-teal-600 border-0">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <h3 className="font-semibold mb-4 text-white">Common Responsibilities</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {(job.core_responsibilities || [
                    'Analyze and approve business operations to improve efficiency and effectiveness',
                    'Work closely with various departments to streamline processes and improve outcomes',
                    'Use data analysis and metrics to support strategic initiatives and identify opportunities',
                    'Identify operational risks and develop strategies to mitigate them',
                    'Manage and oversee multiple projects, ensuring timely completion and alignment with business objectives',
                    'Identify operational risks and develop strategies to mitigate them'
                  ]).map((responsibility: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-teal-400 mt-1">•</span>
                      <span className="text-white text-sm">{responsibility}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Job Titles (Occupations Only) */}
              {job.job_kind === 'occupation' && (
                <div>
                  <h3 className="font-semibold mb-4 text-white">Related Job Titles</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {(job.related_job_titles || [
                      'Operations Coordinator',
                      'Operations Manager', 
                      'Business Operations Analyst',
                      'Process Improvement Specialist',
                      'Operations Support Specialist',
                      'Business Process Analyst',
                      'Operations Director',
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
            <CardHeader>
              <CardTitle className="text-xl">Trusted Partners in your area are hiring for this occupation</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
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
