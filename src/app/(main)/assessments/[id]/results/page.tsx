'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, Target, TrendingUp, Clock, BookOpen, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getAssessmentById, type Assessment, type AssessmentSkillResult, type Skill } from '@/lib/database/queries'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface SkillGap {
  skill: Skill
  currentLevel: number
  requiredLevel: number
  gap: number
  status: 'proficient' | 'building' | 'needs_development'
}

export default function AssessmentResultsPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (assessmentId) {
      loadAssessmentResults()
    }
  }, [assessmentId])

  const loadAssessmentResults = async () => {
    setLoading(true)
    try {
      const assessmentData = await getAssessmentById(assessmentId)
      if (!assessmentData) {
        router.push('/assessments')
        return
      }
      setAssessment(assessmentData)

      // Calculate skill gaps
      if (assessmentData.skill_results && assessmentData.job) {
        await calculateSkillGaps(assessmentData)
      }
    } catch (error) {
      console.error('Error loading assessment results:', error)
      router.push('/assessments')
    } finally {
      setLoading(false)
    }
  }

  const calculateSkillGaps = async (assessmentData: Assessment) => {
    // Get job skills for comparison
    const { data: jobSkills } = await supabase
      .from('job_skills')
      .select(`
        skill_id,
        proficiency_threshold,
        skill:skills(*)
      `)
      .eq('job_id', assessmentData.job_id)

    if (!jobSkills || !assessmentData.skill_results) return

    const gaps: SkillGap[] = []

    for (const jobSkill of jobSkills) {
      const assessmentResult = assessmentData.skill_results.find(
        (result: AssessmentSkillResult) => result.skill_id === jobSkill.skill_id
      )

      if (assessmentResult) {
        const currentLevel = assessmentResult.score_pct
        const requiredLevel = jobSkill.proficiency_threshold * 100 // Convert to percentage
        const gap = Math.max(0, requiredLevel - currentLevel)

        let status: 'proficient' | 'building' | 'needs_development' = 'needs_development'
        if (currentLevel >= requiredLevel) {
          status = 'proficient'
        } else if (currentLevel >= requiredLevel * 0.7) {
          status = 'building'
        }

        gaps.push({
          skill: jobSkill.skill as unknown as Skill,
          currentLevel,
          requiredLevel,
          gap,
          status
        })
      }
    }

    // Sort by gap size (largest gaps first)
    gaps.sort((a, b) => b.gap - a.gap)
    setSkillGaps(gaps)
  }

  const getReadinessStatus = (readiness: number | null) => {
    if (!readiness) return { label: 'Not Available', color: 'gray' }

    if (readiness >= 85) return { label: 'Role Ready', color: 'green' }
    if (readiness >= 50) return { label: 'Close Gaps', color: 'yellow' }
    return { label: 'Needs Development', color: 'red' }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proficient':
        return <Badge className="bg-green-100 text-green-800">Proficient</Badge>
      case 'building':
        return <Badge className="bg-yellow-100 text-yellow-800">Building</Badge>
      case 'needs_development':
        return <Badge className="bg-red-100 text-red-800">Needs Development</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Assessment results not found.</p>
          <Button asChild className="mt-4">
            <Link href="/assessments">Back to Assessments</Link>
          </Button>
        </div>
      </div>
    )
  }

  const readinessStatus = getReadinessStatus(assessment.readiness_pct ?? null)
  const completionDate = assessment.analyzed_at ? new Date(assessment.analyzed_at).toLocaleDateString() : 'Not completed'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/assessments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assessments
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assessment Results</h1>
              <p className="text-gray-600">
                {assessment.job?.title || 'Unknown Job'} • Completed {completionDate}
              </p>
            </div>
          </div>

          {/* Readiness Score */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {assessment.readiness_pct ? `${assessment.readiness_pct.toFixed(0)}%` : 'N/A'}
                </h2>
                <p className="text-teal-100">Overall Readiness Score</p>
              </div>
              <div className="text-right">
                <Badge
                  className={`text-lg px-4 py-2 ${
                    readinessStatus.color === 'green' ? 'bg-green-200 text-green-800' :
                    readinessStatus.color === 'yellow' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-red-200 text-red-800'
                  }`}
                >
                  {readinessStatus.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessment Type</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{assessment.method}</div>
              <p className="text-xs text-muted-foreground">Skills Assessment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skills Assessed</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assessment.skill_results?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Competencies evaluated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Date</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{completionDate}</div>
              <p className="text-xs text-muted-foreground">Assessment completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Skill Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Skill-by-Skill Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessment.skill_results?.map((result: AssessmentSkillResult) => (
                <div key={result.skill_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{result.skill?.name || 'Unknown Skill'}</h3>
                      <span className="text-lg font-bold">{result.score_pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={result.score_pct} className="h-2" />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>Proficiency: {result.band}</span>
                      <span>{result.correct_answers || 0} / {result.total_questions || 0} correct</span>
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-center text-gray-500 py-8">No skill results available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skill Gaps & Recommendations */}
        {skillGaps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Development Opportunities
              </CardTitle>
              <p className="text-sm text-gray-600">
                Areas where you can focus to improve your readiness for this role
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillGaps.slice(0, 5).map((gap, index) => (
                  <div key={gap.skill.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                          <h3 className="font-medium">{gap.skill.name}</h3>
                        </div>
                        {getStatusBadge(gap.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Your Level: {gap.currentLevel.toFixed(0)}%</span>
                        <span>Required: {gap.requiredLevel.toFixed(0)}%</span>
                        <span className="text-red-600 font-medium">
                          Gap: {gap.gap.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={(gap.currentLevel / gap.requiredLevel) * 100} className="h-2 mt-2" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <Button asChild className="w-full">
                  <Link href="/programs">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Find Programs to Close These Gaps
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessment.readiness_pct && assessment.readiness_pct >= 85 ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">🎉 You're Role Ready!</h3>
                  <p className="text-sm text-green-700 mb-3">
                    Your skills align well with this role. Consider applying or preparing your application materials.
                  </p>
                  <Button size="sm" variant="outline">Explore Similar Jobs</Button>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">📚 Keep Developing</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Focus on the skills above to improve your readiness. Programs can help accelerate your progress.
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/programs">Browse Programs</Link>
                  </Button>
                </div>
              )}

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">🔄 Retake Assessment</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Skills develop over time. Retake this assessment in a few months to track your progress.
                </p>
                <Button size="sm" variant="outline">Schedule Follow-up</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
