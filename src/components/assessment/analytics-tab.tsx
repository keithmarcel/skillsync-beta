'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { Users, TrendingUp, Award, Target, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

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
    userName: string
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

      // Get top performers (top 10) - showing user IDs for now
      const topPerformers = (assessments || []).slice(0, 10).map((a: any) => ({
        userId: a.user_id,
        userName: `User ${a.user_id.substring(0, 8)}...`, // Simplified for now
        readiness: a.readiness_pct || 0,
        completedAt: a.analyzed_at || ''
      }))

      // Get questions for this quiz
      const { data: sections } = await supabase
        .from('quiz_sections')
        .select('id')
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
            importance_level,
            skills (
              id,
              name
            )
          `)
          .in('section_id', sections.map(s => s.id))

        // For now, we'll show placeholder data since we don't have assessment_answers table yet
        // In production, you'd query assessment_answers to get actual performance
        questionPerformance = (questions || []).map((q: any) => ({
          questionId: q.id,
          questionText: q.stem,
          correctRate: Math.random() * 100, // Placeholder
          totalAttempts: totalAssessments
        }))

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
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalAssessments}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Readiness</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.avgReadiness}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ready (90%+)</p>
                <p className="text-2xl font-bold text-green-600">{analytics.readinessDistribution.excellent}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Developing</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.readinessDistribution.developing}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Readiness Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Readiness Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Excellent (90%+)</span>
                <span className="text-sm text-gray-600">
                  {analytics.readinessDistribution.excellent} candidates
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${(analytics.readinessDistribution.excellent / analytics.totalAssessments) * 100}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Good (85-89%)</span>
                <span className="text-sm text-gray-600">
                  {analytics.readinessDistribution.good} candidates
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${(analytics.readinessDistribution.good / analytics.totalAssessments) * 100}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Developing (&lt;85%)</span>
                <span className="text-sm text-gray-600">
                  {analytics.readinessDistribution.developing} candidates
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
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
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topPerformers.map((performer, idx) => (
                <div key={performer.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-teal-700">#{idx + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{performer.userName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(performer.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-teal-600">{performer.readiness}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skill Gaps */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.skillGaps.slice(0, 5).map((skill) => (
                <div key={skill.skillId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{skill.skillName}</span>
                      <span className="text-xs text-gray-500">
                        {'⭐'.repeat(skill.importance)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {Math.round(skill.avgScore)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        skill.avgScore >= 80 ? 'bg-green-500' :
                        skill.avgScore >= 60 ? 'bg-yellow-500' :
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

      {/* Question Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Question Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.questionPerformance.slice(0, 10).map((question) => (
              <div key={question.questionId} className="flex items-center justify-between p-3 border-b last:border-b-0">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 line-clamp-1">{question.questionText}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {question.totalAttempts} attempts
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <p className={`text-sm font-semibold ${
                    question.correctRate >= 80 ? 'text-green-600' :
                    question.correctRate >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {Math.round(question.correctRate)}% correct
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
