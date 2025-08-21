import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { routes } from '@/lib/routes'
import { getStatusTagLabel, getStatusTagColor } from '@/lib/readiness'

// Mock data - will be replaced with real API calls
const mockAssessments = [
  {
    id: '1',
    job: { title: 'Senior Software Developer', job_kind: 'featured_role', category: 'Technology' },
    readiness_pct: 85,
    status_tag: 'role_ready',
    method: 'resume',
    analyzed_at: '2024-01-15T10:30:00Z',
    gaps_count: 2
  },
  {
    id: '2',
    job: { title: 'Data Analyst', job_kind: 'occupation', category: 'Analytics' },
    readiness_pct: 68,
    status_tag: 'close_gaps',
    method: 'quiz',
    analyzed_at: '2024-01-12T14:20:00Z',
    gaps_count: 5
  },
  {
    id: '3',
    job: { title: 'Project Manager', job_kind: 'occupation', category: 'Management' },
    readiness_pct: 42,
    status_tag: 'needs_development',
    method: 'resume',
    analyzed_at: '2024-01-08T09:15:00Z',
    gaps_count: 8
  }
]

function AssessmentCard({ assessment }: { assessment: any }) {
  const getNextStepCTA = () => {
    switch (assessment.status_tag) {
      case 'role_ready':
        return { text: 'Share Score', variant: 'default' as const }
      case 'close_gaps':
        return { text: 'View Programs', variant: 'default' as const }
      case 'needs_development':
        return { text: 'Retake Assessment', variant: 'outline' as const }
      default:
        return { text: 'View Details', variant: 'outline' as const }
    }
  }

  const nextStep = getNextStepCTA()

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{assessment.job.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>{assessment.job.category}</span>
              <Badge variant="outline" className="text-xs">
                {assessment.job.job_kind === 'featured_role' ? 'Featured Role' : 'Occupation'}
              </Badge>
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{assessment.readiness_pct}%</div>
            <Badge className={getStatusTagColor(assessment.status_tag)}>
              {getStatusTagLabel(assessment.status_tag)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {assessment.method === 'resume' ? '📄 Resume' : '📝 Quiz'}
            </Badge>
            <span>Analyzed {new Date(assessment.analyzed_at).toLocaleDateString()}</span>
          </div>
          <span>{assessment.gaps_count} skill gaps</span>
        </div>
        
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={routes.assessment(assessment.id)}>View Report</Link>
          </Button>
          <Button variant={nextStep.variant} className="flex-1">
            {nextStep.text}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MyAssessmentsPage() {
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
              <Link href={routes.jobs} className="text-gray-500 hover:text-gray-900">
                Jobs
              </Link>
              <Link href={routes.programs} className="text-gray-500 hover:text-gray-900">
                Programs
              </Link>
              <Link href={routes.myAssessments} className="text-gray-900 font-medium">
                My Assessments
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assessments</h1>
          <p className="text-gray-600">Track your skills progress and career readiness over time.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-green-600">
                {mockAssessments.filter(a => a.status_tag === 'role_ready').length}
              </CardTitle>
              <CardDescription>Roles Ready</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">You're qualified for these positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-blue-600">
                {Math.round(mockAssessments.reduce((sum, a) => sum + a.readiness_pct, 0) / mockAssessments.length)}%
              </CardTitle>
              <CardDescription>Average Readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Across all your assessments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-purple-600">
                {mockAssessments.length}
              </CardTitle>
              <CardDescription>Total Assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Completed evaluations</p>
            </CardContent>
          </Card>
        </div>

        {/* Assessments List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Assessments</h2>
            <Button asChild>
              <Link href={routes.jobs}>Take New Assessment</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockAssessments.map((assessment) => (
              <AssessmentCard key={assessment.id} assessment={assessment} />
            ))}
          </div>

          {mockAssessments.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No assessments yet</h3>
                  <p className="text-gray-600 mb-6">
                    Take your first skills assessment to get started on your career journey.
                  </p>
                  <Button asChild size="lg">
                    <Link href={routes.jobs}>Explore Jobs & Take Assessment</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
