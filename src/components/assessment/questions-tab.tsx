import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { Plus, Sparkles } from 'lucide-react'
import { QuestionCard } from './question-card'
import { QuestionModal } from './question-modal'
import { supabase } from '@/lib/supabase/client'
import type { QuizQuestion } from '@/types/assessment'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface QuestionsTabProps {
  quizId: string
  jobId: string
  onQuestionCountChange?: (count: number) => void
}

export function QuestionsTab({ quizId, jobId, onQuestionCountChange }: QuestionsTabProps) {
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [skills, setSkills] = useState<Array<{ id: string; name: string }>>([])
  const [sectionId, setSectionId] = useState<string | null>(null)
  
  // Modal states
  const [questionModalOpen, setQuestionModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<QuizQuestion | null>(null)

  useEffect(() => {
    loadData()
  }, [quizId, jobId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load skills for this job using established API pattern
      if (jobId) {
        console.log('🔍 Loading skills for job:', jobId)

        try {
          // Use established API endpoint (same as admin role editor)
          const response = await fetch(`/api/admin/roles/${jobId}/skills`)
          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()
          const skillsList = (data.skills || []).map((skill: any) => ({
            id: skill.id,
            name: skill.name,
            category: skill.category
          }))

          console.log('✅ Real skills list from API:', skillsList)
          setSkills(skillsList)
        } catch (error) {
          console.error('❌ Error loading skills from API:', error)
          // Fallback to empty array on error
          setSkills([])
        }
      } else {
        console.log('⚠️ No jobId provided')
        setSkills([])
      }
      
      // Get or create quiz section
      let { data: sections } = await supabase
        .from('quiz_sections')
        .select('id')
        .eq('quiz_id', quizId)
        .limit(1)
      
      let currentSectionId: string
      
      if (!sections || sections.length === 0) {
        // Create default section
        const { data: newSection, error: sectionError } = await supabase
          .from('quiz_sections')
          .insert({
            quiz_id: quizId,
            title: 'Assessment Questions',
            display_order: 1
          })
          .select('id')
          .single()
        
        if (sectionError) throw sectionError
        currentSectionId = newSection.id
      } else {
        currentSectionId = sections[0].id
      }
      
      setSectionId(currentSectionId)
      
      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          skill:skills(id, name, category)
        `)
        .eq('section_id', currentSectionId)
        .order('display_order')
      
      if (questionsError) throw questionsError
      const loadedQuestions = questionsData || []
      setQuestions(loadedQuestions)
      
      // Notify parent of question count
      if (onQuestionCountChange) {
        onQuestionCountChange(loadedQuestions.length)
      }
      
    } catch (error) {
      console.error('Error loading questions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load questions',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQuestion = async (questionData: Partial<QuizQuestion>) => {
    if (!sectionId) return
    
    try {
      if (questionData.id) {
        // Update existing question
        const { error } = await supabase
          .from('quiz_questions')
          .update(questionData)
          .eq('id', questionData.id)
        
        if (error) throw error
        
        toast({
          title: 'Success',
          description: 'Question updated successfully'
        })
      } else {
        // Create new question
        const newQuestion = {
          ...questionData,
          section_id: sectionId,
          display_order: questions.length + 1
        }
        
        console.log('📝 Creating question with data:', newQuestion)
        
        const { error } = await supabase
          .from('quiz_questions')
          .insert(newQuestion)
        
        if (error) {
          console.error('❌ Database error:', error)
          throw error
        }
        
        toast({
          title: 'Success',
          description: 'Question created successfully'
        })
      }
      
      // Reload questions
      await loadData()
      setEditingQuestion(null)
    } catch (error) {
      console.error('Error saving question:', error)
      throw error
    }
  }

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question)
    setQuestionModalOpen(true)
  }

  const handleDeleteClick = (question: QuizQuestion) => {
    setQuestionToDelete(question)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return
    
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionToDelete.id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Question deleted successfully'
      })
      
      setDeleteDialogOpen(false)
      setQuestionToDelete(null)
      await loadData()
    } catch (error) {
      console.error('Error deleting question:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        variant: 'destructive'
      })
    }
  }

  const handleCreateQuestion = () => {
    setEditingQuestion(null)
    setQuestionModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size={80} text="Loading Questions" />
      </div>
    )
  }

  // Empty state
  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-teal-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Questions Yet</h3>
          <p className="text-gray-600 text-center mb-6 max-w-md">
            Start building your assessment by creating questions or using AI to generate them automatically.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleCreateQuestion}
              className="bg-[#0694A2] hover:bg-[#047481] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Question
            </Button>
            <Button
              variant="outline"
              className="border-[#0694A2] text-[#047481] hover:bg-[#0694A2] hover:text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
          </div>
        </div>

        {/* Question Modal */}
        <QuestionModal
          open={questionModalOpen}
          onOpenChange={setQuestionModalOpen}
          onSave={handleSaveQuestion}
          editQuestion={editingQuestion}
          skills={skills}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
          <p className="text-sm text-gray-600 mt-1">
            {questions.length} {questions.length === 1 ? 'question' : 'questions'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleCreateQuestion}
            className="bg-[#0694A2] hover:bg-[#047481] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
          <Button
            variant="outline"
            className="border-[#0694A2] text-[#047481] hover:bg-[#0694A2] hover:text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            onEdit={() => handleEditQuestion(question)}
            onDelete={() => handleDeleteClick(question)}
          />
        ))}
      </div>

      {/* Question Modal */}
      <QuestionModal
        open={questionModalOpen}
        onOpenChange={setQuestionModalOpen}
        onSave={handleSaveQuestion}
        editQuestion={editingQuestion}
        skills={skills}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
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
              Delete Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
