'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  BarChart3,
  Eye
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase/client'
import type { Quiz } from '@/types/assessment'

interface EmployerAssessmentsTabProps {
  companyId: string
}

interface QuizWithStats extends Quiz {
  total_questions: number
  total_assessments: number
  avg_readiness: number
}

export function EmployerAssessmentsTab({ companyId }: EmployerAssessmentsTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [assessments, setAssessments] = useState<QuizWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assessmentToDelete, setAssessmentToDelete] = useState<QuizWithStats | null>(null)

  useEffect(() => {
    loadAssessments()
  }, [companyId])

  const loadAssessments = async () => {
    try {
      setLoading(true)

      // Get all quizzes for this company
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select(`
          *,
          job:jobs!job_id(
            id,
            title,
            soc_code,
            company_id
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (quizzesError) throw quizzesError

      // Get stats for each quiz
      const quizzesWithStats = await Promise.all(
        (quizzes || []).map(async (quiz) => {
          // Get assessment count and average readiness
          const { data: assessmentData } = await supabase
            .from('assessments')
            .select('readiness_pct')
            .eq('quiz_id', quiz.id)
            .not('readiness_pct', 'is', null)

          const totalAssessments = assessmentData?.length || 0
          const avgReadiness = totalAssessments > 0
            ? Math.round((assessmentData!.reduce((sum, a) => sum + (a.readiness_pct || 0), 0) / totalAssessments) * 100) / 100
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
            total_questions: totalQuestions,
            total_assessments: totalAssessments,
            avg_readiness: avgReadiness
          }
        })
      )

      setAssessments(quizzesWithStats)
    } catch (error) {
      console.error('Error loading assessments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load assessments',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssessment = () => {
    router.push('/employer/assessments/new')
  }

  const handleEditAssessment = (assessmentId: string) => {
    router.push(`/employer/assessments/${assessmentId}/edit`)
  }

  const handleViewAnalytics = (assessmentId: string) => {
    router.push(`/employer/assessments/${assessmentId}/analytics`)
  }

  const handleDeleteClick = (assessment: QuizWithStats) => {
    setAssessmentToDelete(assessment)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', assessmentToDelete.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Assessment deleted successfully'
      })
      setDeleteDialogOpen(false)
      setAssessmentToDelete(null)
      loadAssessments() // Reload list
    } catch (error) {
      console.error('Error deleting assessment:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete assessment',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Published</Badge>
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>
      case 'archived':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Archived</Badge>
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{status}</Badge>
    }
  }

  // Empty state
  if (!loading && assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-teal-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assessments Yet</h3>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          Create your first assessment to evaluate candidates for your roles. 
          Use AI to generate questions or build custom assessments from scratch.
        </p>
        <Button 
          onClick={handleCreateAssessment}
          className="bg-[#0694A2] hover:bg-[#047481] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create First Assessment
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 font-source-sans-pro">Manage Your Assessments</h2>
        <Button 
          onClick={handleCreateAssessment}
          className="bg-[#0694A2] hover:bg-[#047481] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0694A2]"></div>
        </div>
      )}

      {/* Assessment Cards */}
      {!loading && (
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <Card 
              key={assessment.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleEditAssessment(assessment.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Left: Assessment Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assessment.title}
                      </h3>
                      {getStatusBadge(assessment.status)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {assessment.job?.title || 'No role assigned'}
                    </p>

                    {assessment.description && (
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {assessment.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {assessment.total_questions} {assessment.total_questions === 1 ? 'Question' : 'Questions'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {assessment.total_assessments || 0} {assessment.total_assessments === 1 ? 'Assessment' : 'Assessments'} Taken
                        </span>
                      </div>

                      {assessment.total_assessments > 0 && (
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {assessment.avg_readiness}% Avg Readiness
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        handleEditAssessment(assessment.id)
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Assessment
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        handleViewAnalytics(assessment.id)
                      }}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View Analytics
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(assessment)
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Assessment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{assessmentToDelete?.title}"? This action cannot be undone and will remove all associated questions and candidate results.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
