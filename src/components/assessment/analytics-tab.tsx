'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { Users, TrendingUp, Award, Target, BarChart3, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

interface AnalyticsTabProps {
  quizId: string
  isAdmin?: boolean
}

interface AnalyticsData {
  totalAssessments: number
  avgReadiness: number
  readinessDistribution: {
    excellent: number  // 90%+
    good: number       // 85-89%
    developing: number // <85%
  }
  questionPerformance: Array<{
    questionId: string
    questionText: string
    skillName: string
    correctRate: number
    totalAttempts: number
  }>
  skillGaps: Array<{
    skillId: string
    skillName: string
    avgScore: number
    importance: number
  }>
  topPerformers: Array<{
    userId: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    readiness: number
    completedAt: string
  }>
}

export function AnalyticsTab({ quizId, isAdmin = false }: AnalyticsTabProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [quizId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      // Get all assessments for this quiz (without user data for now since relation may not exist)
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select('id, user_id, readiness_pct, analyzed_at')
        .eq('quiz_id', quizId)
        .not('readiness_pct', 'is', null)
        .order('readiness_pct', { ascending: false })

      if (assessmentsError) throw assessmentsError

      const totalAssessments = assessments?.length || 0

      // Calculate average readiness
      const avgReadiness = totalAssessments > 0
        ? Math.round((assessments!.reduce((sum, a) => sum + (a.readiness_pct || 0), 0) / totalAssessments) * 100) / 100
        : 0

      // Calculate readiness distribution
      const excellent = assessments?.filter(a => (a.readiness_pct || 0) >= 90).length || 0
      const good = assessments?.filter(a => (a.readiness_pct || 0) >= 85 && (a.readiness_pct || 0) < 90).length || 0
      const developing = assessments?.filter(a => (a.readiness_pct || 0) < 85).length || 0

      // Get top performers with user profile data
      const userIds = (assessments || []).slice(0, 10).map(a => a.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds)
      
      const topPerformers = (assessments || []).slice(0, 10).map((a: any) => {
        const profile = profiles?.find(p => p.id === a.user_id)
        return {
          userId: a.user_id,
          firstName: profile?.first_name || 'Unknown',
          lastName: profile?.last_name || 'User',
          avatarUrl: profile?.avatar_url || null,
          readiness: a.readiness_pct || 0,
          completedAt: a.analyzed_at || ''
        }
      })

      // Get questions for this quiz with skill information
      const { data: sections } = await supabase
        .from('quiz_sections')
        .select('id, skill_id, skill:skills(id, name)')
        .eq('quiz_id', quizId)

      let questionPerformance: any[] = []
      let skillGaps: any[] = []

      if (sections && sections.length > 0) {
        const { data: questions } = await supabase
          .from('quiz_questions')
          .select(`
            id,
            stem,
            skill_id,
            section_id,
            importance_level,
            skills (
              id,
              name
            )
          `)
          .in('section_id', sections.map(s => s.id))

        // Get actual response data
        const assessmentIds = (assessments || []).map(a => a.id)
        const { data: responses } = await supabase
          .from('quiz_responses')
          .select('question_id, is_correct')
          .in('assessment_id', assessmentIds)

        // Calculate actual performance per question
        questionPerformance = (questions || []).map((q: any) => {
          const questionResponses = responses?.filter(r => r.question_id === q.id) || []
          const correctCount = questionResponses.filter(r => r.is_correct).length
          const correctRate = questionResponses.length > 0 ? (correctCount / questionResponses.length) * 100 : 0
          
          // Get skill name from section
          const section = sections.find(s => s.id === q.section_id)
          const skillName = section?.skill?.name || 'Unknown Skill'
          
          return {
            questionId: q.id,
            questionText: q.stem,
            skillName: skillName,
            correctRate: correctRate,
            totalAttempts: questionResponses.length
          }
        })

        // Calculate skill gaps
        const skillMap = new Map()
        questions?.forEach((q: any) => {
          if (q.skills) {
            const skill = Array.isArray(q.skills) ? q.skills[0] : q.skills
            if (skill && !skillMap.has(skill.id)) {
              skillMap.set(skill.id, {
                skillId: skill.id,
                skillName: skill.name,
                avgScore: Math.random() * 100, // Placeholder
                importance: q.importance_level
              })
            }
          }
        })
        skillGaps = Array.from(skillMap.values()).sort((a, b) => a.avgScore - b.avgScore)
      }

      setAnalytics({
        totalAssessments,
        avgReadiness,
        readinessDistribution: {
          excellent,
          good,
          developing
        },
        questionPerformance,
        skillGaps,
        topPerformers
      })

    } catch (error) {
      console.error('Error loading analytics:', error)
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size={80} text="Loading Analytics" />
      </div>
    )
  }

  if (!analytics || analytics.totalAssessments === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Yet</h3>
          <p className="text-gray-600 text-center max-w-md">
            Analytics will appear here once candidates start taking this assessment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards - Match Employer Dashboard Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Total Assessments</p>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.totalAssessments}</div>
            <p className="text-xs text-gray-500">Completed</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Avg Readiness</p>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.avgReadiness}%</div>
            <p className="text-xs text-gray-500">Overall score</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Role Ready</p>
              <CheckCircle className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.readinessDistribution.excellent}</div>
            <p className="text-xs text-gray-500">90%+ proficiency</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Developing</p>
              <Target className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.readinessDistribution.developing}</div>
            <p className="text-xs text-gray-500">Below 85%</p>
          </CardContent>
        </Card>
      </div>

      {/* Readiness Distribution */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Readiness Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Role Ready (90%+)</span>
                <span className="text-sm text-gray-600">
                  {analytics.readinessDistribution.excellent} candidates
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${(analytics.readinessDistribution.excellent / analytics.totalAssessments) * 100}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Close Gaps (85-89%)</span>
                <span className="text-sm text-gray-600">
                  {analytics.readinessDistribution.good} candidates
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-teal-500 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${(analytics.readinessDistribution.good / analytics.totalAssessments) * 100}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Build Foundation (&lt;85%)</span>
                <span className="text-sm text-gray-600">
                  {analytics.readinessDistribution.developing} candidates
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-orange-500 h-2.5 rounded-full transition-all"
                  style={{
                    width: `${(analytics.readinessDistribution.developing / analytics.totalAssessments) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
            <div className="space-y-4">
              {analytics.topPerformers.map((performer, idx) => (
                <div key={performer.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {performer.avatarUrl ? (
                      <Image
                        src={performer.avatarUrl}
                        alt={`${performer.firstName} ${performer.lastName}`}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{performer.firstName} {performer.lastName}</p>
                      {performer.readiness >= 90 && (
                        <p className="text-xs text-teal-600 font-medium">Top Performer</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(performer.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${
                      performer.readiness >= 90 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    } border-0 rounded-full shadow-none flex items-center gap-1`} style={{ fontSize: '10px' }}>
                      <span>{performer.readiness >= 90 ? 'Ready' : 'Almost There'}</span>
                      <span className={performer.readiness >= 90 ? 'text-green-600' : 'text-orange-600'}>|</span>
                      <span className="font-semibold">{Math.round(performer.readiness)}%</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skill Gaps */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Needing Development</h3>
            <div className="space-y-4">
              {analytics.skillGaps.slice(0, 5).map((skill) => (
                <div key={skill.skillId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{skill.skillName}</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {Math.round(skill.avgScore)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        skill.avgScore >= 80 ? 'bg-green-500' :
                        skill.avgScore >= 60 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${skill.avgScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Performance - Organized by Skill */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Performance by Skill</h3>
          <div className="space-y-6">
            {(() => {
              // Group questions by skill
              const questionsBySkill = analytics.questionPerformance.reduce((acc: any, q) => {
                if (!acc[q.skillName]) acc[q.skillName] = []
                acc[q.skillName].push(q)
                return acc
              }, {})
              
              return Object.entries(questionsBySkill).map(([skillName, questions]: [string, any]) => (
                <div key={skillName} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900">{skillName}</h4>
                    <Badge className="bg-gray-100 text-gray-700 border-0 rounded-full shadow-none text-xs">
                      {questions.length} questions
                    </Badge>
                  </div>
                  {questions.slice(0, 5).map((question: any) => (
                    <div key={question.questionId} className="flex items-start justify-between gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-2">{question.questionText}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {question.totalAttempts} {question.totalAttempts === 1 ? 'attempt' : 'attempts'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge className={`${
                          question.correctRate >= 80 ? 'bg-green-100 text-green-800' :
                          question.correctRate >= 60 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        } border-0 rounded-md shadow-none text-xs font-medium min-w-[60px] justify-center`}>
                          {Math.round(question.correctRate)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
