'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import PageHeader from '@/components/ui/page-header'
import BreadcrumbLayout from '@/components/ui/breadcrumb-layout'
import AssessmentStepper from '@/components/ui/assessment-stepper'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Clock, CheckCircle } from 'lucide-react'

type QuizState = 'loading' | 'intro' | 'in-progress' | 'submitting'

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const quizId = params.quizId as string

  const [quizState, setQuizState] = useState<QuizState>('loading')
  const [quiz, setQuiz] = useState<any>(null)
  const [job, setJob] = useState<any>(null)
  const [sections, setSections] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})

  useEffect(() => {
    loadQuizData()
  }, [quizId])

  const loadQuizData = async () => {
    try {
      console.log('Loading quiz:', quizId)
      
      // Load quiz with job details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          *,
          job:jobs!job_id(*, company:companies(name, logo_url))
        `)
        .eq('id', quizId)
        .single()

      if (quizError) {
        console.error('Quiz error:', quizError)
        throw quizError
      }

      console.log('Quiz loaded:', quizData)
      setQuiz(quizData)
      setJob(quizData.job)

      // Load quiz sections with skills
      console.log('Loading sections for quiz:', quizId)
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('quiz_sections')
        .select(`
          *,
          skill:skills(id, name, category)
        `)
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true })

      if (sectionsError) {
        console.error('Sections error:', sectionsError)
        throw sectionsError
      }
      
      console.log('Sections loaded:', sectionsData?.length)
      setSections(sectionsData || [])

      // Load all questions for all sections
      const sectionIds = sectionsData?.map(s => s.id) || []
      console.log('Loading questions for sections:', sectionIds.length)
      
      if (sectionIds.length > 0) {
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .in('section_id', sectionIds)

        if (questionsError) {
          console.error('Questions error:', questionsError)
          throw questionsError
        }
        
        console.log('Questions loaded:', questionsData?.length)
        setQuestions(questionsData || [])
      }

      console.log('Quiz data loaded successfully, setting state to intro')
      setQuizState('intro')
    } catch (error) {
      console.error('Error loading quiz:', error)
      setQuizState('intro') // Show error state instead of hanging
    }
  }

  const handleStartQuiz = () => {
    setQuizState('in-progress')
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      handleSubmitQuiz()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!user?.id) {
      console.error('No user logged in')
      return
    }

    setQuizState('submitting')

    try {
      // Create assessment record
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          user_id: user.id,
          job_id: job.id,
          quiz_id: quizId,
          method: 'quiz',
          status_tag: 'pending'
        })
        .select()
        .single()

      if (assessmentError) throw assessmentError

      // Save quiz responses
      const responsesToSave = questions.map(q => {
        const selectedAnswer = responses[q.id]
        const isCorrect = selectedAnswer === q.answer_key

        return {
          assessment_id: assessment.id,
          question_id: q.id,
          skill_id: sections.find(s => s.id === q.section_id)?.skill_id,
          selected: selectedAnswer,
          is_correct: isCorrect
        }
      })

      const { error: responsesError } = await supabase
        .from('quiz_responses')
        .insert(responsesToSave)

      if (responsesError) throw responsesError

      // Redirect to analyzing page
      router.push(`/assessments/${assessment.id}/analyzing`)

    } catch (error) {
      console.error('Error submitting quiz:', error)
      setQuizState('in-progress')
    }
  }

  if (quizState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!quiz || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Quiz not found</p>
          <Button asChild className="mt-4">
            <a href="/jobs">Back to Jobs</a>
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentSection = sections.find(s => s.id === currentQuestion?.section_id)
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header First */}
      <PageHeader
        title={`${job.title} Assessment`}
        subtitle={job.company?.name ? `${job.company.name} | ${questions.length} Questions` : `${questions.length} Questions`}
        variant="split"
      />

      {/* Breadcrumb Layout wraps content */}
      <BreadcrumbLayout items={[
        { label: 'Jobs', href: '/jobs' },
        { label: job.title, href: `/jobs/${job.id}` },
        { label: 'Assessment', isActive: true }
      ]}>
        {/* Assessment Stepper */}
        <div className="mb-8">
          <AssessmentStepper steps={[
            { id: '1', label: 'Assess Your Skills', status: quizState === 'intro' ? 'current' : 'completed' },
            { id: '2', label: 'SkillSync Readiness Score', status: 'upcoming' },
            { id: '3', label: 'Education Program Matches', status: 'upcoming' }
          ]} />
        </div>
        {quizState === 'intro' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Ready to Test Your Skills?</CardTitle>
                  <CardDescription>
                    This assessment will evaluate your knowledge across {sections.length} key skill areas for {job.title}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Estimated Time</p>
                      <p className="text-sm text-blue-700">{quiz.estimated_minutes || 15} minutes</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Total Questions</p>
                      <p className="text-sm text-green-700">{questions.length} questions across {sections.length} skills</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleStartQuiz} className="bg-[#114B5F] hover:bg-[#0d3a4a] text-white w-full">
                      Start Assessment →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills Covered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sections.map((section, index) => (
                      <div key={section.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm">{section.skill?.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {quizState === 'in-progress' && currentQuestion && (
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Skill: {currentSection?.skill?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{Math.round(progress)}% Complete</p>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{currentQuestion.stem}</h3>
                  
                  <RadioGroup
                    value={responses[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                  >
                    <div className="space-y-3">
                      {Object.entries(currentQuestion.choices || {}).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value={key} id={`${currentQuestion.id}-${key}`} />
                          <Label htmlFor={`${currentQuestion.id}-${key}`} className="flex-1 cursor-pointer">
                            {value}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    ← Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!responses[currentQuestion.id]}
                    className="bg-[#114B5F] hover:bg-[#0d3a4a] text-white"
                  >
                    {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Assessment'} →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {quizState === 'submitting' && (
          <div className="max-w-3xl mx-auto text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0694A2] mx-auto mb-4"></div>
            <p className="text-gray-600">Submitting your assessment...</p>
          </div>
        )}
      </BreadcrumbLayout>
    </div>
  )
}
