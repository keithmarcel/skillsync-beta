'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ArrowLeft, Edit, AlertCircle, Eye, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Breadcrumb from '@/components/ui/breadcrumb'
import SkillWeightingDisplay from '@/components/admin/SkillWeightingDisplay'
import SkillsCurationInterface from '@/components/admin/SkillsCurationInterface'
import { useSkillWeighting } from '@/hooks/useSkillWeighting'

interface Quiz {
  id: string
  job_id: string
  title: string | null
  description: string | null
  status: 'draft' | 'published' | 'archived'
  total_questions: number
  questions_per_assessment: number
  estimated_minutes: number
  ai_generated: boolean
  is_standard: boolean
  company_id: string | null
  created_at: string
  updated_at: string
  soc_code: string | null
  version: number
  company?: {
    name: string
  }
  sections?: QuizSection[]
}

interface QuizSection {
  id: string
  title: string
  description: string | null
  questions_per_section: number
  total_questions: number
  skill?: {
    name: string
    category: string
  }
  questions?: QuizQuestion[]
}

interface QuizQuestion {
  id: string
  section_id: string
  skill_id: string | null
  stem: string
  choices: Record<string, string>
  answer_key: string
  explanation: string | null
  difficulty: string | null
  points: number
  is_active: boolean
  usage_count: number
  last_used_at: string | null
  correct_answer: string | null
  created_at: string
  updated_at: string
}

export default function QuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  
  // Add skill weighting functionality
  const { 
    skills: skillWeighting, 
    loading: weightingLoading, 
    updateSkillWeighting 
  } = useSkillWeighting(quizId)

  useEffect(() => {
    if (quizId) {
      loadQuiz()
    }
  }, [quizId])

  const loadQuiz = async () => {
    try {
      setLoading(true)
      
      // First get the quiz data
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single()

      if (quizError) throw quizError

      // Then get sections with skills
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('quiz_sections')
        .select(`
          *,
          skill:skills(name, category)
        `)
        .eq('quiz_id', quizId)
        .order('order_index')

      if (sectionsError) throw sectionsError

      // Get question counts for each section
      const sectionsWithCounts = await Promise.all(
        (sectionsData || []).map(async (section) => {
          const { data: questions, error } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('section_id', section.id)
            .order('created_at')

          return {
            ...section,
            total_questions: questions?.length || 0,
            questions: questions || []
          }
        })
      )

      // Combine the data
      const quiz = {
        ...quizData,
        sections: sectionsWithCounts
      }

      setQuiz(quiz)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/assessments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Button>
          </Link>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Quiz not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb items={[
        { label: 'Admin', href: '/admin' },
        { label: 'Assessments', href: '/admin/assessments' },
        { label: quiz?.title || 'Quiz Details', isActive: true }
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/assessments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{quiz.title || `Quiz for Job ID: ${quiz.job_id}`}</h1>
            <p className="text-gray-600">SOC Code: {quiz.soc_code || 'Not specified'}</p>
          </div>
        </div>
        
        <Link href={`/admin/assessments/${quiz.id}/quiz/edit`}>
          <Button className="bg-[#114B5F] hover:bg-[#0d3a4a]">
            <Edit className="h-4 w-4 mr-2" />
            Edit Quiz
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="weighting">Skills Weighting</TabsTrigger>
          <TabsTrigger value="curation">Skills Curation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quiz Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <Badge className={`ml-2 ${getStatusColor(quiz.status)}`}>
                    {quiz.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Questions:</span>
                  <span className="ml-2">{quiz.sections?.reduce((sum, s) => sum + (s.total_questions || 0), 0) || 0}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Questions per Assessment:</span>
                  <span className="ml-2">{quiz.questions_per_assessment || 15}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Estimated Time:</span>
                  <span className="ml-2">{quiz.estimated_minutes} minutes</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">AI Generated:</span>
                  <span className="ml-2">Yes</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Company:</span>
                  <span className="ml-2">{quiz.company?.name || 'Standard'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sections</CardTitle>
                <CardDescription>
                  {quiz.sections?.length || 0} skill sections
                </CardDescription>
              </CardHeader>
              <CardContent>
                {quiz.sections && quiz.sections.length > 0 ? (
                  <div className="space-y-2">
                    {quiz.sections.map((section, index) => (
                      <div key={section.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{section.skill?.name || section.title}</div>
                          <div className="text-sm text-gray-600">
                            {section.total_questions} questions
                          </div>
                        </div>
                        <Badge variant="outline">
                          {section.skill?.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No sections found</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timestamps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Created:</span>
                  <div className="text-sm">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(quiz.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Updated:</span>
                  <div className="text-sm">
                    {new Date(quiz.updated_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(quiz.updated_at).toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questions">
          {quiz.sections && quiz.sections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Questions by Section</CardTitle>
                <CardDescription>
                  Click on sections to view and manage questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quiz.sections.map((section) => (
                    <div key={section.id} className="border rounded-lg">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedSections.has(section.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <div>
                            <h3 className="font-semibold">{section.skill?.name || section.title}</h3>
                            <p className="text-sm text-gray-600">
                              {section.total_questions} questions
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{section.skill?.category}</Badge>
                          <Badge variant="secondary">
                            Business
                          </Badge>
                        </div>
                      </div>
                      
                      {expandedSections.has(section.id) && (
                        <div className="border-t p-4 bg-gray-50">
                          {section.questions && section.questions.length > 0 ? (
                            <div className="space-y-4">
                              {section.questions.map((question, index) => (
                                <div key={question.id} className="bg-white p-4 rounded border">
                                  <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-medium">Question {index + 1}</h4>
                                    <div className="flex gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {question.difficulty}
                                      </Badge>
                                      <Button variant="outline" size="sm">
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <p className="font-medium text-sm text-gray-600 mb-1">Question:</p>
                                      <p>{question.stem}</p>
                                    </div>
                                    
                                    <div>
                                      <p className="font-medium text-sm text-gray-600 mb-2">Choices:</p>
                                      <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(question.choices as Record<string, string>).map(([key, value]) => (
                                          <div 
                                            key={key} 
                                            className={`p-2 rounded border text-sm ${
                                              key === question.answer_key 
                                                ? 'bg-green-50 border-green-200 text-green-800' 
                                                : 'bg-gray-50'
                                            }`}
                                          >
                                            <span className="font-medium">{key.toUpperCase()}:</span> {value}
                                            {key === question.answer_key && (
                                              <span className="ml-2 text-green-600">✓</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No questions found for this section</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="weighting">
          {weightingLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <SkillWeightingDisplay 
              skills={skillWeighting}
              onWeightingChange={updateSkillWeighting}
              showMarketIntelligence={true}
            />
          )}
        </TabsContent>

        <TabsContent value="curation">
          {quiz.soc_code ? (
            <SkillsCurationInterface
              socCode={quiz.soc_code}
              onSkillsSelected={(skillIds) => {
                console.log('Skills selected for curation:', skillIds)
                // TODO: Implement skill curation save
              }}
              initialSelectedSkills={[]}
              readOnly={false}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No SOC code available for this quiz</p>
                  <p className="text-sm">Skills curation requires a valid SOC code</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
