import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { routes } from '@/lib/routes'

// Mock data for dashboard - will be replaced with real data
const mockStats = {
  rolesReady: 3,
  overallReadiness: 72,
  skillsIdentified: 24,
  gapsHighlighted: 8
}

const mockRecentAssessments = [
  {
    id: '1',
    jobTitle: 'Software Developer',
    readiness: 85,
    status: 'role_ready',
    analyzedAt: '2024-01-15'
  },
  {
    id: '2', 
    jobTitle: 'Data Analyst',
    readiness: 68,
    status: 'close_gaps',
    analyzedAt: '2024-01-12'
  }
]

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">SkillSync</h1>
            </div>
            <nav className="flex space-x-8">
              <Link href={routes.home} className="text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link href={routes.jobs} className="text-gray-500 hover:text-gray-900">
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-gray-600">Track your skills progress and discover new opportunities.</p>
        </div>

        {/* Snapshot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-green-600">
                {mockStats.rolesReady}
              </CardTitle>
              <CardDescription>Roles Ready</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                You're qualified for these positions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-blue-600">
                {mockStats.overallReadiness}%
              </CardTitle>
              <CardDescription>Overall Readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Average across all assessments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-purple-600">
                {mockStats.skillsIdentified}
              </CardTitle>
              <CardDescription>Skills Identified</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Total skills in your profile
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-orange-600">
                {mockStats.gapsHighlighted}
              </CardTitle>
              <CardDescription>Gaps Highlighted</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Skills to develop further
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assessments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Your latest skills evaluations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockRecentAssessments.map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{assessment.jobTitle}</h4>
                    <p className="text-sm text-gray-600">
                      Assessed on {new Date(assessment.analyzedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">{assessment.readiness}%</span>
                    <Badge variant={assessment.status === 'role_ready' ? 'default' : 'secondary'}>
                      {assessment.status === 'role_ready' ? 'Ready' : 'Close Gaps'}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button asChild className="w-full">
                <Link href={routes.myAssessments}>View All Assessments</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with your next assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full" size="lg">
                <Link href={routes.jobs}>Explore Jobs</Link>
              </Button>
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href={routes.programs}>Browse Programs</Link>
              </Button>
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Popular Assessments</h4>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    Software Developer Assessment
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    Data Analyst Assessment
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    Project Manager Assessment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
