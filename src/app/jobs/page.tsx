import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const mockJobs = [
  {
    id: '1',
    title: 'Software Developer',
    description: 'Build and maintain web applications using modern technologies like React, Node.js, and cloud platforms.',
    job_kind: 'featured_role',
    category: 'Technology',
    location_city: 'St. Petersburg',
    location_state: 'FL',
    companies: { name: 'TechCorp', logo_url: null, is_trusted_partner: true }
  },
  {
    id: '2', 
    title: 'Data Analyst',
    description: 'Analyze complex datasets to help organizations make data-driven decisions using SQL, Python, and visualization tools.',
    job_kind: 'featured_role',
    category: 'Analytics',
    location_city: 'Tampa',
    location_state: 'FL',
    companies: { name: 'DataFlow Inc', logo_url: null, is_trusted_partner: false }
  },
  {
    id: '3',
    title: 'Registered Nurse',
    description: 'Provide patient care in hospital and clinical settings. Requires RN license and clinical experience.',
    job_kind: 'occupation',
    category: 'Healthcare',
    location_city: 'Clearwater',
    location_state: 'FL',
    companies: { name: 'Pinellas Health', logo_url: null, is_trusted_partner: true }
  },
  {
    id: '4',
    title: 'Digital Marketing Specialist',
    description: 'Develop and execute digital marketing campaigns across social media, email, and web platforms.',
    job_kind: 'featured_role',
    category: 'Marketing',
    location_city: 'St. Petersburg',
    location_state: 'FL',
    companies: { name: 'Creative Agency', logo_url: null, is_trusted_partner: false }
  }
]

export default function JobsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Jobs in Pinellas County</h1>
        <p className="text-gray-600">
          Discover high-demand roles and featured opportunities in your area
        </p>
      </div>

      <div className="text-sm text-gray-600">
        Showing {mockJobs.length} featured jobs and occupations
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="space-y-1">
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={job.job_kind === 'featured_role' ? 'default' : 'secondary'}>
                    {job.job_kind === 'featured_role' ? 'Featured Role' : 'Occupation'}
                  </Badge>
                  <Badge variant="outline">{job.category}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>
                {job.description}
              </CardDescription>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="mr-2">📍</span>
                  {job.location_city}, {job.location_state}
                </div>
                
                <div className="flex items-center">
                  <span className="mr-2">🏢</span>
                  {job.companies.name}
                  {job.companies.is_trusted_partner && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Trusted Partner
                    </Badge>
                  )}
                </div>
              </div>

              <Button asChild className="w-full">
                <Link href={`/jobs/${job.id}`}>
                  Assess Skills
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
