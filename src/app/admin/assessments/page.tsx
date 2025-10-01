'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Play, Users, BookOpen, Target, TrendingUp, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getQuizBySocCode, getQuizById, type Quiz, type Assessment } from '@/lib/database/queries'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface QuizWithStats extends Quiz {
  total_assessments?: number
  avg_readiness?: number
  job?: {
    id: string
    title: string
    soc_code: string
  }
}

export default function AdminAssessmentsPage() {
  const [quizzes, setQuizzes] = useState<QuizWithStats[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [readinessFilter, setReadinessFilter] = useState<string>('all')

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadQuizzes(), loadAssessments()])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQuizzes = async () => {
    try {
      // Get all quizzes from database with job details
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          company:companies(name),
          job:jobs!job_id(id, title, soc_code)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // For each quiz, get assessment stats and question count
      const quizzesWithStats = await Promise.all(
        (data || []).map(async (quiz) => {
          // Get assessment count and average readiness for this quiz
          const { data: assessmentData } = await supabase
            .from('assessments')
            .select('readiness_pct')
            .eq('quiz_id', quiz.id)
            .not('readiness_pct', 'is', null)

          const totalAssessments = assessmentData?.length || 0
          const avgReadiness = totalAssessments > 0
            ? assessmentData!.reduce((sum, a) => sum + (a.readiness_pct || 0), 0) / totalAssessments
            : 0

          // Get question count
          const { data: sections } = await supabase
            .from('quiz_sections')
            .select('id')
            .eq('quiz_id', quiz.id)

          let totalQuestions = 0
          if (sections && sections.length > 0) {
            const { count } = await supabase
              .from('quiz_questions')
              .select('*', { count: 'exact', head: true })
              .in('section_id', sections.map(s => s.id))
            totalQuestions = count || 0
          }

          return {
            ...quiz,
            total_assessments: totalAssessments,
            avg_readiness: Math.round(avgReadiness * 100) / 100,
            total_questions: totalQuestions
          }
        })
      )

      setQuizzes(quizzesWithStats)
    } catch (error) {
      console.error('Error loading quizzes:', error)
    }
  }

  const loadAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          job:jobs(title, soc_code),
          quiz:quizzes(title)
        `)
        .order('analyzed_at', { ascending: false })
        .limit(100) // Limit for performance

      if (error) throw error
      setAssessments(data || [])
    } catch (error) {
      console.error('Error loading assessments:', error)
    }
  }

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.job?.soc_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         searchTerm === ''
    const matchesStatus = statusFilter === 'all' || quiz.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.quiz?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesReadiness = readinessFilter === 'all' ||
      (readinessFilter === 'role_ready' && assessment.readiness_pct && assessment.readiness_pct >= 85) ||
      (readinessFilter === 'close_gaps' && assessment.readiness_pct && assessment.readiness_pct >= 50 && assessment.readiness_pct < 85) ||
      (readinessFilter === 'needs_development' && (!assessment.readiness_pct || assessment.readiness_pct < 50))
    return matchesSearch && matchesReadiness
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'archived':
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getReadinessBadge = (readiness: number | null, status: string | null) => {
    if (!readiness && !status) return <Badge variant="outline">Not Analyzed</Badge>

    if (status === 'role_ready' || (readiness && readiness >= 85)) return <Badge className="bg-green-100 text-green-800">Role Ready</Badge>
    if (status === 'close_gaps' || (readiness && readiness >= 50 && readiness < 85)) return <Badge className="bg-yellow-100 text-yellow-800">Close Gaps</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Development</Badge>
  }

  const handleStatusChange = async (quizId: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ status: newStatus })
        .eq('id', quizId)

      if (error) throw error
      await loadQuizzes()
    } catch (error) {
      console.error('Error updating quiz status:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading assessments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessment Management</h1>
          <p className="text-gray-600">Create and manage quiz templates, view assessment results</p>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="quizzes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quizzes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Quiz Templates ({quizzes.length})
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assessment Results ({assessments.length})
          </TabsTrigger>
        </TabsList>

        {/* Quiz Templates Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <Button asChild>
              <Link href="/admin/assessments/generate">
                <Plus className="h-4 w-4 mr-2" />
                Generate New Quiz
              </Link>
            </Button>
          </div>

          {/* Quiz Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quizzes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {quizzes.filter(q => q.status === 'published').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {quizzes.reduce((sum, q) => sum + (q.total_assessments || 0), 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {quizzes.length > 0
                    ? Math.round(quizzes.reduce((sum, q) => sum + (q.avg_readiness || 0), 0) / quizzes.length * 100) / 100
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quiz Templates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>SOC Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Assessments</TableHead>
                    <TableHead>Avg Readiness</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuizzes.map((quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell className="font-medium">{quiz.job?.title || 'Unknown Job'}</TableCell>
                      <TableCell className="font-mono text-sm">{quiz.job?.soc_code || quiz.soc_code}</TableCell>
                      <TableCell>{getStatusBadge(quiz.status || 'draft')}</TableCell>
                      <TableCell>
                        {quiz.is_standard ? (
                          <Badge variant="outline">Standard</Badge>
                        ) : (
                          <Badge variant="secondary">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>{quiz.total_questions || 0}</TableCell>
                      <TableCell>{quiz.total_assessments || 0}</TableCell>
                      <TableCell>
                        {quiz.avg_readiness ? `${quiz.avg_readiness}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/assessments/${quiz.id}/quiz`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/assessments/${quiz.id}/quiz/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/assessments/${quiz.id}/quiz/take`}>
                                <Play className="h-4 w-4 mr-2" />
                                Preview Quiz
                              </Link>
                            </DropdownMenuItem>
                            {quiz.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(quiz.id, 'published')}>
                                <Play className="h-4 w-4 mr-2" />
                                Publish Quiz
                              </DropdownMenuItem>
                            )}
                            {quiz.status === 'published' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(quiz.id, 'draft')}>
                                <Edit className="h-4 w-4 mr-2" />
                                Unpublish Quiz
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredQuizzes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No quiz templates found matching your criteria.
                  <div className="mt-4">
                    <Button asChild>
                      <Link href="/admin/assessments/generate">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Quiz
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessment Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={readinessFilter}
                onChange={(e) => setReadinessFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Readiness</option>
                <option value="role_ready">Role Ready (85%+)</option>
                <option value="close_gaps">Close Gaps (50-84%)</option>
                <option value="needs_development">Needs Development (&lt;50%)</option>
              </select>
            </div>
          </div>

          {/* Assessment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assessments.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Role Ready</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assessments.filter(a => a.readiness_pct && a.readiness_pct >= 85).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Readiness</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assessments.length > 0
                    ? Math.round(assessments.reduce((sum, a) => sum + (a.readiness_pct || 0), 0) / assessments.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assessments.length > 0
                    ? Math.round((assessments.filter(a => a.analyzed_at).length / assessments.length) * 100)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Related Job</TableHead>
                    <TableHead>SOC Code</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Readiness</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell>{assessment.quiz?.title || 'Unknown Quiz'}</TableCell>
                      <TableCell>{assessment.job?.title || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{assessment.job?.soc_code || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{assessment.method}</TableCell>
                      <TableCell>{getReadinessBadge(assessment.readiness_pct, assessment.status_tag)}</TableCell>
                      <TableCell>
                        {assessment.analyzed_at
                          ? new Date(assessment.analyzed_at).toLocaleDateString()
                          : 'Not completed'
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/assessments/${assessment.id}/results`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Results
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/assessments/${assessment.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Assessment
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredAssessments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No assessment results found matching your criteria.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
