import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { routes } from '@/lib/routes'
import { getBandColor, getBandLabel, getStatusTagColor, getStatusTagLabel } from '@/lib/readiness'

// Mock data - will be replaced with real API calls
const mockAssessment = {
  id: '1',
  job: { title: 'Senior Software Developer', job_kind: 'featured_role' },
  readiness_pct: 85,
  status_tag: 'role_ready',
  method: 'resume',
  analyzed_at: '2024-01-15T10:30:00Z',
  assessment_skill_results: [
    { skills: { name: 'JavaScript', category: 'Programming' }, score_pct: 92, band: 'proficient' },
    { skills: { name: 'React', category: 'Frontend' }, score_pct: 88, band: 'proficient' },
    { skills: { name: 'Node.js', category: 'Backend' }, score_pct: 78, band: 'building' },
    { skills: { name: 'TypeScript', category: 'Programming' }, score_pct: 85, band: 'proficient' },
    { skills: { name: 'SQL', category: 'Database' }, score_pct: 65, band: 'building' },
    { skills: { name: 'Git', category: 'Version Control' }, score_pct: 45, band: 'needs_dev' },
    { skills: { name: 'Docker', category: 'DevOps' }, score_pct: 38, band: 'needs_dev' }
  ],
  ai_summary: "Great work! You've demonstrated strong proficiency in core programming languages like JavaScript and TypeScript, along with solid React skills. Focus on strengthening your backend development with Node.js and database management to become fully role-ready."
}

function ReadinessGauge({ percentage }: { percentage: number }) {
  const segments = 10
  const filledSegments = Math.round((percentage / 100) * segments)
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={`h-4 w-8 rounded-sm ${
            i < filledSegments ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        />
      ))}
      <span className="ml-2 text-sm font-medium">{percentage}%</span>
    </div>
  )
}

function SkillBar({ skill }: { skill: any }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium">{skill.skills.name}</span>
          <span className="text-sm font-semibold">{skill.score_pct}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${skill.score_pct}%` }}
            />
          </div>
          <Badge className={getBandColor(skill.band)} variant="secondary">
            {getBandLabel(skill.band)}
          </Badge>
        </div>
      </div>
    </div>
  )
}

export default function AssessmentReportPage({ params }: { params: { id: string } }) {
  const assessment = mockAssessment // In real app: await getAssessment(params.id)
  
  const skillsByBand = {
    proficient: assessment.assessment_skill_results.filter(s => s.band === 'proficient'),
    building: assessment.assessment_skill_results.filter(s => s.band === 'building'),
    needs_dev: assessment.assessment_skill_results.filter(s => s.band === 'needs_dev')
  }

  const totalSkills = assessment.assessment_skill_results.length
  const demonstratedSkills = skillsByBand.proficient.length + skillsByBand.building.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href={routes.myAssessments} className="text-blue-600 hover:text-blue-800">
            ← Back to My Assessments
          </Link>
        </nav>

        {/* Assessment Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {assessment.job.title} Assessment
            </h1>
            <p className="text-lg text-gray-600">
              You've demonstrated <strong>{demonstratedSkills} of {totalSkills}</strong> core skills.
            </p>
          </div>

          {/* Readiness Score */}
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {assessment.readiness_pct}%
            </div>
            <Badge className={getStatusTagColor(assessment.status_tag)} variant="secondary">
              {getStatusTagLabel(assessment.status_tag)}
            </Badge>
            <div className="mt-4 max-w-md mx-auto">
              <ReadinessGauge percentage={assessment.readiness_pct} />
            </div>
          </div>

          {/* AI Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                🤖 AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{assessment.ai_summary}</p>
            </CardContent>
          </Card>
        </div>

        {/* Skills Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Skills Breakdown</CardTitle>
            <CardDescription>
              Detailed analysis of your proficiency in each required skill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assessment.assessment_skill_results
              .sort((a, b) => b.score_pct - a.score_pct)
              .map((skill, index) => (
                <SkillBar key={index} skill={skill} />
              ))}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📈 Program Matches
                <Badge className="bg-green-100 text-green-800">
                  {skillsByBand.needs_dev.length + skillsByBand.building.length} programs found
                </Badge>
              </CardTitle>
              <CardDescription>
                Educational programs to help you close skill gaps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                We found programs that can help you develop the skills you need most.
              </p>
              <Button asChild className="w-full">
                <Link href={routes.programMatches(assessment.id)}>
                  View Program Matches
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <Badge variant="outline">
                  {assessment.method === 'resume' ? '📄 Resume Analysis' : '📝 Quiz'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Analyzed:</span>
                <span>{new Date(assessment.analyzed_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Skills Assessed:</span>
                <span>{totalSkills}</span>
              </div>
              <div className="pt-4 border-t space-y-2">
                <Button variant="outline" className="w-full">
                  📤 Share Results
                </Button>
                <Button variant="outline" className="w-full">
                  🔄 Retake Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
