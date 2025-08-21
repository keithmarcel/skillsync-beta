import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'
import { ArrowLeft, Heart, MapPin, DollarSign, Users, Clock } from 'lucide-react'

// Mock data - will be replaced with real API calls
const mockJob = {
  id: '1',
  title: 'Senior Software Developer',
  job_kind: 'featured_role',
  soc_code: '15-1252',
  category: 'Technology',
  job_type: 'Full-time',
  location_city: 'St. Petersburg',
  location_state: 'FL',
  median_wage_usd: 95000,
  long_desc: 'We are seeking a Senior Software Developer to join our innovative team. You will be responsible for designing, developing, and maintaining high-quality software applications that serve millions of users. This role offers the opportunity to work with cutting-edge technologies and collaborate with a talented team of engineers.',
  featured_image_url: null,
  skills_count: 12,
  company: {
    name: 'TechCorp',
    logo_url: null,
    is_trusted_partner: true,
    bio: 'TechCorp is a leading technology company focused on creating innovative solutions that transform how businesses operate. Founded in 2010, we have grown to serve over 10,000 clients worldwide.'
  },
  job_skills: [
    { skill: { name: 'JavaScript', category: 'Programming' }, weight: 1.0 },
    { skill: { name: 'React', category: 'Frontend' }, weight: 0.9 },
    { skill: { name: 'Node.js', category: 'Backend' }, weight: 0.8 },
    { skill: { name: 'TypeScript', category: 'Programming' }, weight: 0.8 },
    { skill: { name: 'SQL', category: 'Database' }, weight: 0.7 },
    { skill: { name: 'Git', category: 'Version Control' }, weight: 0.6 }
  ]
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = mockJob // In real app: await getJob(params.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={job.title}
        subtitle={`${job.location_city}, ${job.location_state} • ${job.job_type}`}
        variant="split"
        primaryAction={{
          label: "Start Assessment",
          href: `/assessments/job/${job.id}`
        }}
        secondaryAction={{
          label: "Save Job",
          onClick: () => console.log("Save job")
        }}
      />

      {/* Main Content */}
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/jobs" className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
        </nav>

        {/* Job Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                {job.company?.logo_url ? (
                  <img src={job.company.logo_url} alt="logo" className="w-12 h-12 rounded" />
                ) : (
                  <span className="text-xl font-semibold">{job.company?.name?.[0] || 'J'}</span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <div className="flex items-center gap-2 mb-2">
                  {job.soc_code && (
                    <Badge variant="outline">SOC: {job.soc_code}</Badge>
                  )}
                  <Button variant="ghost" size="sm">♡ Favorite</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sponsor Panel (for featured roles) */}
          {job.job_kind === 'featured_role' && job.company && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Featured Employer</CardTitle>
                  {job.company.is_trusted_partner && (
                    <Badge className="bg-blue-100 text-blue-800">Trusted Partner</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">{job.company.bio}</p>
                <Button variant="outline" size="sm">About Company</Button>
              </CardContent>
            </Card>
          )}

          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Overview</h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="secondary">{job.category}</Badge>
                  <Badge variant="secondary">{job.job_type}</Badge>
                  <Badge variant="secondary">{job.skills_count} skills</Badge>
                </div>
                {job.median_wage_usd && (
                  <p><strong>Median Salary:</strong> ${job.median_wage_usd.toLocaleString()}</p>
                )}
                {job.location_city && job.location_state && (
                  <p><strong>Location:</strong> {job.location_city}, {job.location_state}</p>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700">{job.long_desc}</p>
            </div>
          </div>
        </div>

        {/* Skills & Responsibilities */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Skills & Responsibilities</CardTitle>
            <CardDescription>Core skills required for this role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Required Skills</h3>
                <div className="space-y-2">
                  {job.job_skills.map((jobSkill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{jobSkill.skill.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({jobSkill.skill.category})</span>
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${jobSkill.weight * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Key Responsibilities</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Design and develop scalable software applications</li>
                  <li>• Collaborate with cross-functional teams</li>
                  <li>• Write clean, maintainable code</li>
                  <li>• Participate in code reviews and testing</li>
                  <li>• Stay current with technology trends</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment CTA */}
        <Card>
          <CardHeader>
            <CardTitle>Take Your Free Skills Assessment</CardTitle>
            <CardDescription>
              Discover how ready you are for this role and identify areas for improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button size="lg" className="h-16">
                📄 Upload Resume
                <span className="block text-xs opacity-75">Get instant skills analysis</span>
              </Button>
              <Button variant="outline" size="lg" className="h-16">
                📝 Start Quiz
                <span className="block text-xs opacity-75">Answer skill-based questions</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
