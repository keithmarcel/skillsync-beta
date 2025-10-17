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
  const [programs, setPrograms] = useState<any[]>([])
  const [inviteSent, setInviteSent] = useState(false)
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

      // Check if auto-invite was sent
      if (assessmentData.readiness_pct >= 85) {
        const { data: invite } = await supabase
          .from('employer_invitations')
          .select('id, status')
          .eq('assessment_id', assessmentId)
          .eq('status', 'sent')
          .single()
        
        if (invite) {
          setInviteSent(true)
        }
      }

      // Load programs for low proficiency (<85%)
      if (assessmentData.readiness_pct < 85 && assessmentData.job?.soc_code) {
        const { data: programsData } = await supabase
          .from('programs')
          .select(`
            id,
            name,
            program_type,
            duration_text,
            school:schools(name)
          `)
          .eq('status', 'published')
          .limit(6)
        
        if (programsData) {
          setPrograms(programsData)
        }
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

        {/* Auto-Invite Notification */}
        {inviteSent && readiness >= 85 && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🎯</div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900">Invitation Sent!</h3>
                  <p className="text-blue-800">
                    Great news! {assessment.job?.company?.name} has been notified of your strong performance. Check your invitations to see their message.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps - Conditional Based on Proficiency */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Next Steps</h2>
          
          {/* HIGH PROFICIENCY (≥90%): Role Ready */}
          {readiness >= 90 && (
            <div className="space-y-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="text-3xl mb-3">🎉 You're Role Ready!</div>
                  <p className="text-green-900 mb-4 text-lg">
                    Congratulations! Your skills align exceptionally well with this role. You're qualified to apply and would be a strong candidate.
                  </p>
                  <div className="flex gap-3">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      View Application
                    </Button>
                    <Button variant="outline" className="bg-white">
                      Explore Similar Roles
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="text-2xl mb-2">📈 Keep Growing</div>
                  <p className="text-blue-900 mb-4">
                    Consider advanced certifications or specialized training to further enhance your expertise and career prospects.
                  </p>
                  <Button variant="outline" className="bg-white">
                    Explore Advanced Training
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* MEDIUM PROFICIENCY (85-89%): Building Skills */}
          {readiness >= 85 && readiness < 90 && (
            <div className="space-y-6">
              <Card className="bg-teal-50 border-teal-200">
                <CardContent className="p-6">
                  <div className="text-3xl mb-3">💪 You're Building Skills!</div>
                  <p className="text-teal-900 mb-4 text-lg">
                    You're very close to being role-ready! Focus on your development areas and you'll be fully qualified soon.
                  </p>
                  <div className="flex gap-3">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                      Find Training Programs
                    </Button>
                    <Button variant="outline" className="bg-white">
                      Retake Assessment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* LOW PROFICIENCY (<85%): Close Gaps */}
          {readiness < 85 && (
            <div className="space-y-6">
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="text-3xl mb-3">📚 Close Your Skills Gaps</div>
                  <p className="text-orange-900 mb-4 text-lg">
                    You have some skill gaps to address. The good news? We've identified training programs that can help you get role-ready.
                  </p>
                </CardContent>
              </Card>

              {/* Programs to Close Gaps */}
              {programs.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-4">Recommended Training Programs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {programs.map((program) => (
                        <Card key={program.id} className="border hover:border-teal-500 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-sm">{program.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {program.program_type}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {program.school?.name}
                            </p>
                            {program.duration_text && (
                              <p className="text-xs text-gray-500 mb-3">
                                Duration: {program.duration_text}
                              </p>
                            )}
                            <Button size="sm" variant="outline" className="w-full text-xs">
                              Learn More
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Button className="mt-4 w-full" variant="outline">
                      View All Programs
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
