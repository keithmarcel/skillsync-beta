'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { PageLoader } from '@/components/ui/loading-spinner'
import { Award, Clock, Calendar, RefreshCw, Lightbulb, ArrowLeft, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

export default function AssessmentResultsPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<any>(null)
  const [skillResults, setSkillResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssessmentResults()
  }, [assessmentId])

  const loadAssessmentResults = async () => {
    try {
      // Load assessment with job details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          *,
          job:jobs(id, title, soc_code, company:companies(name))
        `)
        .eq('id', assessmentId)
        .single()

      if (assessmentError) throw assessmentError
      setAssessment(assessmentData)

      // Load skill results
      const { data: skillsData, error: skillsError } = await supabase
        .from('assessment_skill_results')
        .select('*, skill:skills(name, category)')
        .eq('assessment_id', assessmentId)
        .order('score_pct', { ascending: false })

      if (!skillsError && skillsData) {
        setSkillResults(skillsData)
      }
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (readiness: number) => {
    if (readiness >= 80) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-lg px-4 py-1">Role Ready</Badge>
    } else if (readiness >= 50) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-lg px-4 py-1">Close Gaps</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-lg px-4 py-1">Needs Development</Badge>
    }
  }

  const getSkillColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getGapPct = (score: number) => {
    return Math.max(0, 100 - score)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader text="Loading your results..." />
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Assessment not found</p>
          <Button asChild>
            <Link href="/jobs">Back to Jobs</Link>
          </Button>
        </div>
      </div>
    )
  }

  const readiness = assessment.readiness_pct || 0
  const completedDate = new Date(assessment.analyzed_at || assessment.created_at).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-[1280px] mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/my-assessments')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
            <p className="text-gray-600 mt-1">
              {assessment.job?.title} • Completed {completedDate}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 py-8">
        {/* Large Readiness Score Card */}
        <Card className="mb-8 bg-[#0694A2] text-white border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-6xl font-bold mb-2">{readiness}%</div>
                <div className="text-xl text-white/90">Overall Readiness Score</div>
              </div>
              <div>
                {getStatusBadge(readiness)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Assessment Type */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Target className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">Assessment Type</div>
                  <div className="text-2xl font-bold">Quiz</div>
                  <div className="text-sm text-gray-500">Skills Assessment</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Assessed */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">Skills Assessed</div>
                  <div className="text-2xl font-bold">{skillResults.length}</div>
                  <div className="text-sm text-gray-500">Competencies evaluated</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Date */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">Completion Date</div>
                  <div className="text-2xl font-bold">{completedDate}</div>
                  <div className="text-sm text-gray-500">Assessment completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skill-by-Skill Results */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Award className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-bold">Skill-by-Skill Results</h2>
            </div>

            {skillResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No skill results available</p>
            ) : (
              <div className="space-y-4">
                {skillResults.map((result, index) => {
                  const score = result.score_pct || 0
                  const gap = getGapPct(score)
                  return (
                    <div key={`${result.assessment_id}-${result.skill_id}-${index}`} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{result.skill?.name}</div>
                        <div className="text-sm font-semibold">{score}%</div>
                      </div>
                      <Progress 
                        value={score} 
                        className="h-2"
                      />
                      {gap > 20 && (
                        <div className="text-sm text-gray-600 mt-1">
                          Gap: {gap}% to reach proficiency
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role Ready */}
            {readiness >= 80 && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="text-2xl mb-2">🎉 You're Role Ready!</div>
                  <p className="text-green-900 mb-4">
                    Your skills align well with this role. Consider applying or preparing your application materials.
                  </p>
                  <Button variant="outline" className="bg-white">
                    Explore Similar Jobs
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Close Gaps */}
            {readiness >= 50 && readiness < 80 && (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="text-2xl mb-2">📚 Close Your Gaps</div>
                  <p className="text-orange-900 mb-4">
                    You're close! Focus on developing your weaker skills to become role-ready.
                  </p>
                  <Button variant="outline" className="bg-white">
                    Find Training Programs
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Retake */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-6">
                <div className="text-2xl mb-2">🔄 Retake Assessment</div>
                <p className="text-gray-700 mb-4">
                  Skills develop over time. Retake this assessment in a few months to track your progress.
                </p>
                <Button variant="outline" className="bg-white">
                  Schedule Follow-up
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
