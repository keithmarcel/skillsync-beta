'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Breadcrumb from '@/components/ui/breadcrumb'
import AssessmentStepper from '@/components/ui/assessment-stepper'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, FileText } from 'lucide-react'

// Mock job data - same structure as job detail page
const mockJobData = {
  '1': {
    id: '1',
    title: 'Mechanical Project Manager',
    job_kind: 'featured_role',
    soc_code: '13-1082',
    category: 'Skilled Trades',
    company: { name: 'Power Design' }
  },
  'occ-3': {
    id: 'occ-3',
    title: 'Project Management Specialists',
    job_kind: 'occupation',
    soc_code: '13-1082',
    category: 'Business'
  }
}

// Mock quiz questions
const mockQuizQuestions = [
  {
    id: 1,
    skill: 'Project Management',
    question: 'Which project management methodology emphasizes iterative development and flexibility?',
    options: [
      'Waterfall',
      'Agile',
      'Critical Path Method',
      'PRINCE2'
    ],
    correctAnswer: 1,
    explanation: 'Agile methodology emphasizes iterative development, flexibility, and continuous improvement through short development cycles called sprints.'
  },
  {
    id: 2,
    skill: 'Process Improvement',
    question: 'What is the primary goal of Six Sigma methodology?',
    options: [
      'Increase employee satisfaction',
      'Reduce defects and improve quality',
      'Accelerate project timelines',
      'Expand market reach'
    ],
    correctAnswer: 1,
    explanation: 'Six Sigma is a data-driven methodology focused on reducing defects and improving quality by identifying and removing causes of errors.'
  },
  {
    id: 3,
    skill: 'Data Analysis',
    question: 'Which metric is most useful for measuring project performance against the baseline?',
    options: [
      'Return on Investment (ROI)',
      'Schedule Performance Index (SPI)',
      'Customer Satisfaction Score',
      'Team Velocity'
    ],
    correctAnswer: 1,
    explanation: 'Schedule Performance Index (SPI) measures how efficiently the project team is using time by comparing earned value to planned value.'
  },
  {
    id: 4,
    skill: 'Strategic Planning',
    question: 'What is the first step in strategic planning?',
    options: [
      'Setting objectives',
      'Conducting environmental analysis',
      'Implementing strategies',
      'Evaluating performance'
    ],
    correctAnswer: 1,
    explanation: 'Environmental analysis (including SWOT analysis) is typically the first step to understand internal strengths/weaknesses and external opportunities/threats.'
  },
  {
    id: 5,
    skill: 'Budgeting',
    question: 'What does a positive budget variance indicate?',
    options: [
      'Actual costs exceeded budgeted costs',
      'Actual costs were less than budgeted costs',
      'The project is behind schedule',
      'Revenue exceeded expectations'
    ],
    correctAnswer: 1,
    explanation: 'A positive budget variance means actual costs were less than budgeted costs, indicating favorable performance against the budget.'
  }
]

type QuizState = 'intro' | 'in-progress' | 'completed'

export default function QuizAssessmentPage({ params }: { params: { socCode: string } }) {
  const [quizState, setQuizState] = useState<QuizState>('intro')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  
  const job = mockJobData[params.socCode as keyof typeof mockJobData]
  
  if (!job) {
    return <div>Job not found</div>
  }

  const handleStartQuiz = () => {
    setQuizState('in-progress')
  }

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const handleNext = () => {
    if (showExplanation) {
      setShowExplanation(false)
      if (currentQuestion < mockQuizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        setQuizState('completed')
      }
    } else {
      setShowExplanation(true)
    }
  }

  const calculateScore = () => {
    let correct = 0
    selectedAnswers.forEach((answer, index) => {
      if (answer === mockQuizQuestions[index].correctAnswer) {
        correct++
      }
    })
    return Math.round((correct / mockQuizQuestions.length) * 100)
  }

  const progress = ((currentQuestion + 1) / mockQuizQuestions.length) * 100

  if (quizState === 'intro') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs above header */}
        <div className="bg-gray-50 py-3">
          <div className="max-w-[1280px] mx-auto px-6">
            <Breadcrumb items={[
              { label: 'Jobs', href: '/jobs' },
              { label: 'High Demand Occupations', href: '/jobs' },
              { label: job.title, href: `/jobs/${job.id}` },
              { label: 'SkillSync Assessment', isActive: true }
            ]} />
          </div>
        </div>

        <PageHeader 
          isDynamic={true}
          jobInfo={{
            title: job.title,
            socCode: job.soc_code
          }}
          title={job.title}
          subtitle={`SOC Code: ${job.soc_code}`}
          showPrimaryAction={true}
          primaryAction={{
            label: "Favorite Occupation",
            variant: "favorite",
            isFavorited: false,
            onClick: () => {
              console.log('Toggle favorite for job:', job.id)
            }
          }}
          variant="split"
        />

        {/* Assessment stepper below header */}
        <div className="bg-white py-6 border-b">
          <div className="max-w-[1280px] mx-auto px-6">
            <AssessmentStepper steps={[
              { id: '1', label: 'Assess Your Skills', status: 'current' },
              { id: '2', label: 'SkillSync Readiness Score', status: 'upcoming' },
              { id: '3', label: 'Education Program Matches', status: 'upcoming' }
            ]} />
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quiz Intro */}
            <div className="lg:col-span-2">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl">Ready to Test Your Skills?</CardTitle>
                  <CardDescription>
                    This assessment will evaluate your knowledge across the key skills required for {job.title}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <FileText className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                      <div className="font-semibold">{mockQuizQuestions.length} Questions</div>
                      <div className="text-sm text-gray-600">Multiple choice</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Clock className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <div className="font-semibold">~10 Minutes</div>
                      <div className="text-sm text-gray-600">Estimated time</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                      <div className="font-semibold">Instant Results</div>
                      <div className="text-sm text-gray-600">With explanations</div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-3">Skills Covered:</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(mockQuizQuestions.map(q => q.skill))).map((skill, index) => (
                        <Badge key={index} className="bg-teal-100 text-teal-800">
                          {skill}
                        </Badge>
                      ))}
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

            {/* Job Info Sidebar */}
            <div className="lg:col-span-1">
              <Card className="rounded-2xl sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg">Assessment For</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    {job.job_kind === 'featured_role' && 'company' in job && job.company && (
                      <p className="text-gray-600">at {job.company.name}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-blue-100 text-blue-800">{job.category}</Badge>
                      <Badge variant="outline">SOC: {job.soc_code}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (quizState === 'in-progress') {
    const question = mockQuizQuestions[currentQuestion]
    const isAnswered = selectedAnswers[currentQuestion] !== undefined
    const selectedAnswer = selectedAnswers[currentQuestion]
    const isCorrect = selectedAnswer === question.correctAnswer

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs above header */}
        <div className="bg-gray-50 py-3">
          <div className="max-w-[1280px] mx-auto px-6">
            <Breadcrumb items={[
              { label: 'Jobs', href: '/jobs' },
              { label: 'High Demand Occupations', href: '/jobs' },
              { label: job.title, href: `/jobs/${job.id}` },
              { label: 'SkillSync Assessment', isActive: true }
            ]} />
          </div>
        </div>

        <PageHeader 
          isDynamic={true}
          jobInfo={{
            title: job.title,
            socCode: job.soc_code
          }}
          title={job.title}
          subtitle={`SOC Code: ${job.soc_code}`}
          showPrimaryAction={true}
          primaryAction={{
            label: "Favorite Occupation",
            variant: "favorite",
            isFavorited: false,
            onClick: () => {
              console.log('Toggle favorite for job:', job.id)
            }
          }}
          variant="split"
        />

        {/* Assessment stepper below header */}
        <div className="bg-white py-6 border-b">
          <div className="max-w-[1280px] mx-auto px-6">
            <AssessmentStepper steps={[
              { id: '1', label: 'Assess Your Skills', status: 'current' },
              { id: '2', label: 'SkillSync Readiness Score', status: 'upcoming' },
              { id: '3', label: 'Education Program Matches', status: 'upcoming' }
            ]} />
          </div>
        </div>

        {/* Quiz Progress */}
        <div className="bg-white py-4 border-b">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">Skills Assessment Quiz</h2>
                <p className="text-gray-600">Question {currentQuestion + 1} of {mockQuizQuestions.length}</p>
              </div>
              <div className="text-right">
                <div className="text-gray-600 text-sm mb-1">{Math.round(progress)}% Complete</div>
                <Progress value={progress} className="w-48" />
              </div>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <main className="max-w-[1280px] mx-auto px-6 py-8">
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-teal-100 text-teal-800">{question.skill}</Badge>
              </div>
              <CardTitle className="text-xl">{question.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showExplanation ? (
                <>
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                          selectedAnswer === index
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedAnswer === index
                              ? 'border-teal-500 bg-teal-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedAnswer === index && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={handleNext}
                      disabled={!isAnswered}
                      className="bg-[#114B5F] hover:bg-[#0d3a4a] text-white"
                    >
                      Submit Answer
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                          <span className="text-white text-xs">✕</span>
                        </div>
                      )}
                      <span className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {isCorrect ? 'Correct!' : 'Incorrect'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <p className="text-red-700 mb-2">
                        The correct answer is: <strong>{question.options[question.correctAnswer]}</strong>
                      </p>
                    )}
                    <p className="text-gray-700">{question.explanation}</p>
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={handleNext}
                      className="bg-[#114B5F] hover:bg-[#0d3a4a] text-white"
                    >
                      {currentQuestion < mockQuizQuestions.length - 1 ? 'Next Question' : 'Complete Assessment'} →
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Completed state
  const score = calculateScore()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs above header */}
      <div className="bg-gray-50 py-3">
        <div className="max-w-[1280px] mx-auto px-6">
          <Breadcrumb items={[
            { label: 'Jobs', href: '/jobs' },
            { label: 'High Demand Occupations', href: '/jobs' },
            { label: job.title, href: `/jobs/${job.id}` },
            { label: 'SkillSync Assessment', isActive: true }
          ]} />
        </div>
      </div>

      <PageHeader 
        isDynamic={true}
        jobInfo={{
          title: job.title,
          socCode: job.soc_code
        }}
        title={job.title}
        subtitle={`SOC Code: ${job.soc_code}`}
        showPrimaryAction={true}
        primaryAction={{
          label: "Favorite Occupation",
          variant: "favorite",
          isFavorited: false,
          onClick: () => {
            console.log('Toggle favorite for job:', job.id)
          }
        }}
        variant="split"
      />

      {/* Assessment stepper below header */}
      <div className="bg-white py-6 border-b">
        <div className="max-w-[1280px] mx-auto px-6">
          <AssessmentStepper steps={[
            { id: '1', label: 'Assess Your Skills', status: 'completed' },
            { id: '2', label: 'SkillSync Readiness Score', status: 'current' },
            { id: '3', label: 'Education Program Matches', status: 'upcoming' }
          ]} />
        </div>
      </div>

      {/* Results */}
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        <Card className="rounded-2xl text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Your Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-6xl font-bold text-[#114B5F]">{score}%</div>
            <p className="text-gray-600">
              You answered {selectedAnswers.filter((answer, index) => answer === mockQuizQuestions[index].correctAnswer).length} out of {mockQuizQuestions.length} questions correctly.
            </p>
            <Button asChild className="bg-[#114B5F] hover:bg-[#0d3a4a] text-white">
              <Link href="/assessments/1">
                View Detailed Assessment Report →
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
