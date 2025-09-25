'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import { createAssessment, submitAssessmentResponse, getAssessmentQuestions, completeAssessment } from '@/lib/database/queries'
import type { QuizQuestion } from '@/lib/database/queries'

interface AssessmentFlowProps {
  quizId: string
  jobId?: string
  onComplete: (results: any) => void
}

export function AssessmentFlow({ quizId, jobId, onComplete }: AssessmentFlowProps) {
  const router = useRouter()
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set())
  const [startTime, setStartTime] = useState<Date>(new Date())
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  // Initialize assessment
  useEffect(() => {
    const initializeAssessment = async () => {
      try {
        // Create assessment and get questions
        const newAssessmentId = await createAssessment({
          user_id: 'current-user-id', // TODO: Get from auth
          quiz_id: quizId,
          job_id: jobId,
          selected_questions: [] // Will be populated by backend
        })

        if (!newAssessmentId) throw new Error('Failed to create assessment')

        setAssessmentId(newAssessmentId)

        // Get questions for this assessment
        const assessmentQuestions = await getAssessmentQuestions(newAssessmentId)
        setQuestions(assessmentQuestions)

        setStartTime(new Date())
        setQuestionStartTime(new Date())
      } catch (error) {
        console.error('Failed to initialize assessment:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAssessment()
  }, [quizId, jobId])

  // Handle answer selection
  const handleAnswerSelect = useCallback((answer: string) => {
    setSelectedAnswer(answer)
  }, [])

  // Handle next question
  const handleNext = useCallback(async () => {
    if (!assessmentId || !selectedAnswer || !currentQuestion) return

    setIsSubmitting(true)

    try {
      const timeSpent = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000)

      // Submit response (without showing correctness)
      const success = await submitAssessmentResponse(
        assessmentId,
        currentQuestion.id,
        selectedAnswer,
        timeSpent
      )

      if (success) {
        // Mark question as completed
        setCompletedQuestions(prev => new Set([...prev, currentQuestionIndex]))

        if (isLastQuestion) {
          // Complete assessment
          await completeAssessment(assessmentId)
          onComplete({ assessmentId, totalQuestions: questions.length })
        } else {
          // Move to next question
          setCurrentQuestionIndex(prev => prev + 1)
          setSelectedAnswer('')
          setQuestionStartTime(new Date())
        }
      }
    } catch (error) {
      console.error('Failed to submit response:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [assessmentId, selectedAnswer, currentQuestion, currentQuestionIndex, isLastQuestion, questionStartTime, questions.length, onComplete])

  // Handle previous question
  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setSelectedAnswer('')
      setQuestionStartTime(new Date())
    }
  }, [currentQuestionIndex])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your assessment...</p>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No questions available for this assessment.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            <span>{Math.floor((new Date().getTime() - startTime.getTime()) / 60000)}m elapsed</span>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Question completion indicators */}
        <div className="flex justify-center mt-4 space-x-1">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                completedQuestions.has(index)
                  ? 'bg-green-500'
                  : index === currentQuestionIndex
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.stem}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Answer Options */}
          <div className="space-y-3">
            {Object.entries(currentQuestion.choices).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleAnswerSelect(key)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedAnswer === key
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <span className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center text-sm font-medium ${
                    selectedAnswer === key
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300'
                  }`}>
                    {key.toUpperCase()}
                  </span>
                  <span>{value}</span>
                  {selectedAnswer === key && (
                    <CheckCircle className="w-5 h-5 ml-auto text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!selectedAnswer || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : isLastQuestion ? (
                'Complete Assessment'
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center mt-8 text-sm text-gray-600">
        Take your time - there's no rush. Your thoughtful responses help us understand your skills better.
      </div>
    </div>
  )
}
