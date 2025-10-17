import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { Plus, Sparkles, Rocket, CheckCircle, Trash2, Database, Target, Brain, Bot, Save, PartyPopper, Clock, RefreshCw } from 'lucide-react'
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
  const [generating, setGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [draggedQuestion, setDraggedQuestion] = useState<QuizQuestion | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [questionToDelete, setQuestionToDelete] = useState<QuizQuestion | null>(null)
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false)
  const [selectedGenerationMode, setSelectedGenerationMode] = useState<'add' | 'replace'>('add')

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
      
      // Parse choices JSON string back to object for each question
      const loadedQuestions = (questionsData || []).map((q: any) => ({
        ...q,
        choices: typeof q.choices === 'string' ? JSON.parse(q.choices) : q.choices
      }))
      
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

  const handleDragStart = (e: React.DragEvent, question: QuizQuestion) => {
    setDraggedQuestion(question)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedQuestion(null)
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (!draggedQuestion) return

    const draggedIndex = questions.findIndex(q => q.id === draggedQuestion.id)
    if (draggedIndex === -1 || draggedIndex === dropIndex) return

    // Reorder the questions array
    const newQuestions = [...questions]
    const [removed] = newQuestions.splice(draggedIndex, 1)
    newQuestions.splice(dropIndex, 0, removed)

    // Update display_order for all questions
    const updatedQuestions = newQuestions.map((q, index) => ({
      ...q,
      display_order: index + 1
    }))

    setQuestions(updatedQuestions)
    setDraggedQuestion(null)
    setDragOverIndex(null)

    // Update display_order in database
    try {
      const updates = updatedQuestions.map(q => ({
        id: q.id,
        display_order: q.display_order
      }))

      for (const update of updates) {
        await supabase
          .from('quiz_questions')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
      }

      toast({
        title: 'Success',
        description: 'Question order updated successfully'
      })
    } catch (error) {
      console.error('Error updating question order:', error)
      toast({
        title: 'Error',
        description: 'Failed to update question order',
        variant: 'destructive'
      })
      // Reload to revert changes
      await loadData()
    }
  }

  const proceedWithGeneration = async (shouldReplace: boolean) => {
    try {
      setGenerating(true)
      setGenerationStep(0)

      if (shouldReplace) {
        // User wants to replace - delete existing questions first
        setGenerationStep(2)
        const { error: deleteError } = await supabase
          .from('quiz_questions')
          .delete()
          .eq('section_id', sectionId)

        if (deleteError) {
          console.error('Failed to delete existing questions:', deleteError)
          toast({
            title: 'Error',
            description: 'Failed to remove existing questions',
            variant: 'destructive'
          })
          return
        }
      }

      setGenerationStep(3)

      // Get quiz job information
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('job_id')
        .eq('id', quizId)
        .single()

      if (!quiz?.job_id) {
        throw new Error('Quiz job information not found')
      }

      setGenerationStep(4)

      // Use the working API endpoint to get skills with importance levels
      const skillsResponse = await fetch(`/api/admin/roles/${quiz.job_id}/skills`)
      if (!skillsResponse.ok) {
        throw new Error(`Failed to load skills: ${skillsResponse.status}`)
      }

      const skillsData = await skillsResponse.json()
      const skillsWithImportance = skillsData.skills || []

      if (!skillsWithImportance || skillsWithImportance.length === 0) {
        throw new Error('No skills found for this job')
      }

      setTotalSteps(skillsWithImportance.length + 5) // 5 skills + 5 base steps
      setGenerationStep(5)

      // Generate questions for each skill
      const generatedQuestions: any[] = []

      for (let i = 0; i < skillsWithImportance.length; i++) {
        const skill = skillsWithImportance[i]

        if (!skill) continue

        setGenerationStep(6 + i) // Progress through skills

        try {
          // Determine proficiency level based on importance_level (1-5 scale)
          const importanceLevel = skill.importance_level || 3
          const proficiencyLevel = importanceLevel >= 4 ? 'expert' :
                                 importanceLevel >= 3 ? 'intermediate' : 'beginner'

          // Generate 2-3 questions per skill
          const existingCount = questions.filter(q => q.skill_id === skill.id).length
          const questionCount = Math.min(3, 5 - existingCount)

          if (questionCount <= 0) continue

          // Use API route for server-side generation
          const response = await fetch('/api/admin/quizzes/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              skillId: skill.id,
              skillName: skill.name,
              proficiencyLevel: proficiencyLevel as any,
              questionCount,
              sectionId
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error(`❌ API error for skill ${skill.name}:`, errorData.error || `HTTP ${response.status}`)
            throw new Error(errorData.error || `Generation failed: ${response.status}`)
          }

          const data = await response.json()
          const newQuestions = data.questions

          if (newQuestions.length === 0) {
            console.warn(`⚠️ API returned empty questions array for skill ${skill.name}`)
            continue
          }

          // Convert to database format and add to collection
          const dbQuestions = newQuestions.map((q: any, idx: number) => {
            const dbQuestion = {
              section_id: sectionId,
              skill_id: skill.id,
              stem: q.stem,
              choices: JSON.stringify(q.choices), // Convert choices object to JSON string for database
              answer_key: q.correct_answer,
              explanation: q.explanation,
              difficulty: q.difficulty,
              display_order: questions.length + generatedQuestions.length + idx + 1
            }
            
            // DEBUG: Log what we're about to save
            if (idx === 0) {
              console.log('💾 First question being saved to DB:', {
                stem: dbQuestion.stem?.substring(0, 50),
                choices: dbQuestion.choices,
                answer_key: dbQuestion.answer_key,
                hasChoices: !!q.choices,
                choicesType: typeof q.choices
              })
            }
            
            return dbQuestion
          })

          generatedQuestions.push(...dbQuestions)
        } catch (error) {
          console.error(`❌ Failed to generate questions for skill ${skill.name}:`, error)
          // Continue with other skills
        }
      }

      if (generatedQuestions.length === 0) {
        throw new Error('No questions could be generated')
      }

      setGenerationStep(totalSteps - 2)

      // Insert questions into database
      const { error: insertError } = await supabase
        .from('quiz_questions')
        .insert(generatedQuestions)

      if (insertError) {
        throw insertError
      }

      setGenerationStep(totalSteps - 1)

      toast({
        title: 'Success',
        description: `Generated ${generatedQuestions.length} new questions with AI`
      })

      // Reload questions to show the new ones
      await loadData()

      setGenerationStep(totalSteps)

    } catch (error) {
      console.error('AI generation failed:', error)
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate questions with AI',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
      setGenerationStep(0)
      setTotalSteps(0)
    }
  }

  const handleGenerateWithAI = async () => {
    if (!sectionId) return

    // Check if questions already exist
    if (questions.length > 0) {
      setSelectedGenerationMode('add') // Default to add mode
      setReplaceDialogOpen(true)
      return
    }

    await proceedWithGeneration(false)
  }

  const handleReplaceConfirm = async () => {
    setReplaceDialogOpen(false)
    await proceedWithGeneration(selectedGenerationMode === 'replace')
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
              onClick={handleGenerateWithAI}
              disabled={generating}
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
          <h3 className="text-lg font-medium text-gray-900">Questions</h3>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleCreateQuestion}
            className="bg-[#0694A2] hover:bg-[#047481] text-white"
            disabled={generating}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
          <Button
            variant="outline"
            className="border-[#0694A2] text-[#047481] hover:bg-[#0694A2] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGenerateWithAI}
            disabled={generating}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generating ? 'Generating...' : 'Generate with AI'}
          </Button>
        </div>
      </div>

      {/* AI Generation Progress */}
      {generating && totalSteps > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
              <div>
                <span className="text-blue-800 font-semibold text-lg">Generating AI Questions</span>
                <p className="text-blue-600 text-sm">This may take up to 2 minutes...</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-blue-600 text-2xl font-bold">
                {generationStep}/{totalSteps}
              </span>
              <p className="text-blue-500 text-sm">steps completed</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-blue-100 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${(generationStep / totalSteps) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
            </div>
          </div>

          {/* Step Description */}
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              {generationStep === 0 && <Rocket className="w-4 h-4 text-blue-600" />}
              {generationStep === 1 && <CheckCircle className="w-4 h-4 text-blue-600" />}
              {generationStep === 2 && <Trash2 className="w-4 h-4 text-blue-600" />}
              {generationStep === 3 && <Database className="w-4 h-4 text-blue-600" />}
              {generationStep === 4 && <Target className="w-4 h-4 text-blue-600" />}
              {generationStep === 5 && <Brain className="w-4 h-4 text-blue-600" />}
              {generationStep >= 6 && generationStep < totalSteps - 2 && <Bot className="w-4 h-4 text-blue-600 animate-pulse" />}
              {generationStep === totalSteps - 2 && <Save className="w-4 h-4 text-blue-600" />}
              {generationStep === totalSteps - 1 && <PartyPopper className="w-4 h-4 text-blue-600" />}
              {generationStep === totalSteps && <CheckCircle className="w-4 h-4 text-green-600" />}
              <div className="text-sm text-gray-700 font-medium">
                {generationStep === 0 && "Initializing AI generation pipeline..."}
                {generationStep === 1 && "Confirming generation parameters..."}
                {generationStep === 2 && "Preparing workspace (removing existing questions if needed)..."}
                {generationStep === 3 && "Loading quiz and job information..."}
                {generationStep === 4 && "Retrieving relevant skills for this role..."}
                {generationStep === 5 && "Analyzing skills and preparing AI prompts..."}
                {generationStep >= 6 && generationStep < totalSteps - 2 && (
                  <>
                    Generating questions for skill {(generationStep - 5)} of {totalSteps - 7}...
                    <span className="text-blue-600 ml-2">
                      (This step may take 10-15 seconds per skill)
                    </span>
                  </>
                )}
                {generationStep === totalSteps - 2 && "Saving questions with answers and choices to database..."}
                {generationStep === totalSteps - 1 && "Finalizing and preparing results..."}
                {generationStep === totalSteps && "Complete! Your AI-generated questions with answers are ready."}
              </div>
            </div>
          </div>

          {/* Estimated Time Remaining */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <Clock className="w-3 h-3 text-gray-500" />
            <p className="text-xs text-gray-500">
              {generationStep < totalSteps - 2
                ? `Estimated time remaining: ~${Math.max(1, Math.ceil((totalSteps - generationStep) * 12 / 60))} minutes`
                : "Almost done..."
              }
            </p>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={question.id}
            draggable={!generating}
            onDragStart={(e) => handleDragStart(e, question)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              ${!generating ? 'cursor-move' : 'cursor-default'}
              ${draggedQuestion?.id === question.id ? 'opacity-50' : ''}
              ${dragOverIndex === index ? 'border-t-2 border-blue-500' : ''}
              transition-all duration-200
            `}
          >
            <QuestionCard
              question={question}
              index={index}
              onEdit={() => handleEditQuestion(question)}
              onDelete={() => handleDeleteClick(question)}
              isDragging={draggedQuestion?.id === question.id}
            />
          </div>
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

      {/* Replace Questions Confirmation Dialog */}
      <Dialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate AI Questions</DialogTitle>
            <DialogDescription>
              You already have {questions.length} question{questions.length !== 1 ? 's' : ''}. Would you like to:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {/* Add New Option */}
            <button
              onClick={() => setSelectedGenerationMode('add')}
              className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                selectedGenerationMode === 'add'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-300 hover:bg-teal-25'
              }`}
            >
              <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                selectedGenerationMode === 'add'
                  ? 'border-teal-600 bg-teal-600'
                  : 'border-gray-300'
              }`}>
                {selectedGenerationMode === 'add' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Plus className="w-4 h-4 text-teal-600" />
                  <p className="font-medium text-gray-900">Add new questions</p>
                </div>
                <p className="text-sm text-gray-600">Keep existing questions and add new AI-generated ones</p>
              </div>
            </button>

            {/* Replace All Option */}
            <button
              onClick={() => setSelectedGenerationMode('replace')}
              className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                selectedGenerationMode === 'replace'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
              }`}
            >
              <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                selectedGenerationMode === 'replace'
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-300'
              }`}>
                {selectedGenerationMode === 'replace' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  <p className="font-medium text-gray-900">Replace all questions</p>
                </div>
                <p className="text-sm text-gray-600">Start fresh with new AI-generated questions</p>
              </div>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplaceDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0694A2] hover:bg-[#047481] text-white"
              onClick={handleReplaceConfirm}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
