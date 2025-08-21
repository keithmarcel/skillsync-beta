import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { routes } from '@/lib/routes'

// Mock data - will be replaced with real API calls
const featuredJobs = [
  {
    id: '1',
    title: 'Senior Software Developer',
    company: { name: 'TechCorp', logo_url: null, is_trusted_partner: true },
    category: 'Technology',
    job_type: 'Full-time',
    skills_count: 12,
    median_wage_usd: 95000,
    long_desc: 'Join our innovative team building next-generation software solutions.'
  },
  {
    id: '2',
    title: 'Data Analyst',
    company: { name: 'DataFlow Inc', logo_url: null, is_trusted_partner: true },
    category: 'Analytics',
    job_type: 'Full-time',
    skills_count: 8,
    median_wage_usd: 72000,
    long_desc: 'Analyze complex datasets to drive business insights and decisions.'
  }
]

const highDemandJobs = [
  {
    id: '3',
    title: 'Registered Nurse',
    category: 'Healthcare',
    median_wage_usd: 75000,
    readiness_status: 'assess'
  },
  {
    id: '4',
    title: 'Software Engineer',
    category: 'Technology',
    median_wage_usd: 88000,
    readiness_status: 'close_gaps'
  },
  {
    id: '5',
    title: 'Project Manager',
    category: 'Management',
    median_wage_usd: 82000,
    readiness_status: 'ready'
  }
]

function JobCard({ job }: { job: any }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
          {job.company?.logo_url ? (
            <img src={job.company.logo_url} alt="logo" className="w-8 h-8 rounded" />
          ) : (
            <span className="text-sm font-semibold">{job.company?.name?.[0] || 'J'}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{job.title}</h3>
            {job.company?.is_trusted_partner && (
              <Badge variant="secondary">Trusted Partner</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground flex gap-2">
            <span>{job.category}</span>•<span>{job.job_type}</span>•<span>{job.skills_count} skills</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">{job.long_desc}</p>
        {job.median_wage_usd && (
          <p className="text-sm text-muted-foreground">
            Median salary: ${job.median_wage_usd.toLocaleString()}
          </p>
        )}
      </CardContent>
      <div className="px-6 pb-6">
        <Button asChild className="w-full">
          <Link href={routes.job(job.id)}>Role Details</Link>
        </Button>
      </div>
    </Card>
  )
}

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href={routes.home} className="text-2xl font-bold text-gray-900">
                SkillSync
              </Link>
            </div>
            <nav className="flex space-x-8">
              <Link href={routes.home} className="text-gray-500 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href={routes.jobs} className="text-gray-900 font-medium">
                Jobs
              </Link>
              <Link href={routes.programs} className="text-gray-500 hover:text-gray-900">
                Programs
              </Link>
              <Link href={routes.myAssessments} className="text-gray-500 hover:text-gray-900">
                My Assessments
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Jobs</h1>
          <p className="text-gray-600">Discover opportunities that match your skills and interests.</p>
        </div>

        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="featured">Featured Roles</TabsTrigger>
            <TabsTrigger value="high-demand">High-Demand Occupations</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="high-demand" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>High-Demand Occupations</CardTitle>
                <CardDescription>
                  Popular roles in Pinellas County with strong job growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Occupation</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Median Salary</TableHead>
                      <TableHead>Readiness</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {highDemandJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.category}</TableCell>
                        <TableCell>${job.median_wage_usd.toLocaleString()}</TableCell>
                        <TableCell>
                          {job.readiness_status === 'ready' && (
                            <Badge className="bg-green-100 text-green-800">Ready</Badge>
                          )}
                          {job.readiness_status === 'close_gaps' && (
                            <Badge className="bg-yellow-100 text-yellow-800">Close Gaps</Badge>
                          )}
                          {job.readiness_status === 'assess' && (
                            <Badge variant="outline">Assess</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="outline" size="sm">
                            <Link href={routes.job(job.id)}>Details</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Favorite Jobs</CardTitle>
                <CardDescription>
                  Jobs you've saved for later review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No favorite jobs yet</p>
                  <Button asChild variant="outline">
                    <Link href="#featured">Browse Featured Roles</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
