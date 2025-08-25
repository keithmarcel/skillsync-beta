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

  useEffect(() => {
    async function loadJob() {
      try {
        setLoading(true)
        const jobData = await getJobById(params.id)
        if (jobData) {
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
        showSecondaryAction={true}
        primaryAction={{
          label: "Favorite",
          variant: "favorite",
          isFavorited: false,
          onClick: () => {
            console.log('Toggle favorite for job:', job.id)
          }
        }}
        secondaryAction={{
          label: "Action 2"
        }}
        variant="split"
      />

      <BreadcrumbLayout items={[
        { label: 'Jobs', href: '/jobs' },
        { label: 'Featured Roles', href: '/jobs' },
        { label: job.title, isActive: true }
      ]}>
        {/* Company Info for Featured Roles */}
        {job.job_kind === 'featured_role' && job.company && (
          <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                {job.company.logo_url ? (
                  <img 
                    src={job.company.logo_url} 
                    alt={`${job.company.name} logo`}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-gray-600">
                    {job.company.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{job.company.name}</h3>
                <p className="text-sm text-gray-600">
                  {job.company.hq_city && job.company.hq_state 
                    ? `${job.company.hq_city}, ${job.company.hq_state}` 
                    : 'Location TBD'}
                </p>
              </div>
            </div>
            <CompanyModal company={job.company} />
          </div>
        )}

        {/* Job Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>
                  {job.job_kind === 'featured_role' && job.company 
                    ? `${job.company.name} • ${job.company.hq_city && job.company.hq_state ? `${job.company.hq_city}, ${job.company.hq_state}` : 'Location TBD'}`
                    : `SOC: ${job.soc_code}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-800">{job.category}</Badge>
                  {'job_type' in job && job.job_type && <Badge className="bg-green-100 text-green-800">{job.job_type}</Badge>}
                  <Badge className="bg-purple-100 text-purple-800">{job.skills?.length || 0} Skills</Badge>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#114B5F] text-white p-4 rounded-lg">
                    <div className="text-sm opacity-80">Median Salary</div>
                    <div className="text-xl font-bold">${job.median_wage_usd?.toLocaleString()}</div>
                  </div>
                  {job.job_kind === 'featured_role' ? (
                    <div className="bg-[#114B5F] text-white p-4 rounded-lg">
                      <div className="text-sm opacity-80">Role Location</div>
                      <div className="text-sm text-white">
                        {job.location_city && job.location_state 
                          ? `${job.location_city}, ${job.location_state}`
                          : 'Location TBD'}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#114B5F] text-white p-4 rounded-lg">
                      <div className="text-sm opacity-80">Projected Open Positions</div>
                      <div className="text-sm text-white">
                        {'projected_open_positions' in job && (
                          <span>{job.projected_open_positions.toLocaleString()} projected open positions</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="bg-[#114B5F] text-white p-4 rounded-lg">
                    <div className="text-sm opacity-80">Typical Education Requirements</div>
                    <div className="text-xl font-bold">{job.education_requirements}</div>
                  </div>
                  {job.job_kind === 'featured_role' ? (
                    'proficiency_score' in job ? (
                      <div className="bg-[#114B5F] text-white p-4 rounded-lg">
                        <div className="text-sm opacity-80">Your Proficiency</div>
                        <div className="text-xl font-bold">{job.proficiency_score}%</div>
                      </div>
                    ) : null
                  ) : (
                    'job_growth_outlook' in job ? (
                      <div className="bg-[#114B5F] text-white p-4 rounded-lg">
                        <div className="text-sm opacity-80">Job Growth Outlook</div>
                        <div className="text-xl font-bold">{job.job_growth_outlook}</div>
                      </div>
                    ) : null
                  )}
                </div>

                {/* Description */}
                <div>
                  <p className="text-gray-700 leading-relaxed">{job.long_desc}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Featured Image */}
          <div className="lg:col-span-1">
            {job.featured_image_url && (
              <div className="sticky top-8">
                <Image 
                  src={job.featured_image_url} 
                  alt={job.title} 
                  width={400} 
                  height={300} 
                  className="rounded-2xl w-full h-auto"
                />
              </div>
            )}
          </div>
        </div>

        {/* Skills & Responsibilities */}
        <Card className="rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Skills and Responsibilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Core Skills */}
              <div>
                <h3 className="font-semibold mb-4">Core Skills</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {job.skills?.map((jobSkill: any, index: number) => (
                    <Badge key={index} className="bg-teal-100 text-teal-800 hover:bg-teal-100">
                      {jobSkill.skill?.name || 'Unknown Skill'}
                    </Badge>
                  ))}
                </div>

                <h3 className="font-semibold mb-4">Common Responsibilities</h3>
                <ul className="space-y-2 text-gray-700">
                  {job.core_responsibilities?.map((responsibility: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-teal-600 mt-1">•</span>
                      <span>{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related Job Titles (Occupations Only) */}
              {job.job_kind === 'occupation' && 'related_job_titles' in job && job.related_job_titles && (
                <div>
                  <h3 className="font-semibold mb-4">Related Job Titles</h3>
                  <ul className="space-y-2 text-gray-700">
                    {job.related_job_titles.map((title: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-teal-600 mt-1">•</span>
                        <span>{title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills Gap Assessment */}
        <Card className="rounded-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Take Your Free Skills Gap Assessment</CardTitle>
            <CardDescription>
              We'll assess your skills, show you how they align with industry benchmarks, and recommend top regional programs that can help close any gaps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[#114B5F] text-white border-0">
                <CardContent className="p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Assess Your Resume</h3>
                  <p className="text-sm opacity-90 mb-4">Upload your Resume</p>
                  <Button asChild className="bg-white text-[#114B5F] hover:bg-gray-100 w-full">
                    <Link href={`/assessments/resume/${job.id}`}>
                      Upload Your Resume →
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-[#114B5F] text-white border-0">
                <CardContent className="p-6 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Take a Skills Assessment</h3>
                  <p className="text-sm opacity-90 mb-4">Start Your Quiz</p>
                  <Button asChild className="bg-white text-[#114B5F] hover:bg-gray-100 w-full">
                    <Link href={`/assessments/quiz/${job.id}`}>
                      Start Your Quiz →
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Hiring Companies for Occupations */}
        {job.job_kind === 'occupation' && 'hiring_companies' in job && job.hiring_companies && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Trusted Partners in your area are hiring for this occupation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {job.hiring_companies.map((company: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Image src={company.logo} alt={`${company.name} logo`} width={40} height={40} className="rounded" />
                    <span className="font-medium">{company.name}</span>
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
