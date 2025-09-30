'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Save, AlertCircle, CheckCircle, Edit, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Breadcrumb from '@/components/ui/breadcrumb'

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
}

export default function EditQuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sections, setSections] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('basic')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    questions_per_assessment: 15,
    estimated_minutes: 15
  })

  useEffect(() => {
    if (quizId) {
      loadQuiz()
      loadSections()
    }
  }, [quizId])

  useEffect(() => {
    if (quiz) {
      setFormData({
        title: quiz.title || '', // Convert null to empty string
        description: quiz.description || '', // Convert null to empty string
        status: quiz.status || 'draft', // Provide default
        questions_per_assessment: quiz.questions_per_assessment || 15, // Provide default
        estimated_minutes: quiz.estimated_minutes || 15 // Provide default
      })
    }
  }, [quiz])

  const loadQuiz = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *
        `)
        .eq('id', quizId)
        .single()

      if (error) throw error
      setQuiz(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const loadSections = async () => {
    try {
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('quiz_sections')
        .select(`
          *,
          skill:skills(name, category)
        `)
        .eq('quiz_id', quizId)
        .order('order_index')

      if (sectionsError) throw sectionsError

      // Load questions for each section
      const sectionsWithQuestions = await Promise.all(
        (sectionsData || []).map(async (section) => {
          const { data: questions, error } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('section_id', section.id)
            .order('created_at')

          return {
            ...section,
            questions: questions || []
          }
        })
      )

      setSections(sectionsWithQuestions)
    } catch (err) {
      console.error('Failed to load sections:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quiz) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const { error } = await supabase
        .from('quizzes')
        .update({
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          questions_per_assessment: formData.questions_per_assessment,
          estimated_minutes: formData.estimated_minutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', quiz.id)

      if (error) throw error

      setSuccess('Quiz updated successfully!')
      
      // Reload quiz data
      await loadQuiz()

      // Redirect back to quiz detail after a delay
      setTimeout(() => {
        router.push(`/admin/assessments/${quiz.id}/quiz`)
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quiz')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && !quiz) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/assessments/${quizId}/quiz`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quiz
            </Button>
          </Link>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!quiz) return null

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb items={[
        { label: 'Admin', href: '/admin' },
        { label: 'Assessments', href: '/admin/assessments' },
        { label: quiz?.title || 'Quiz Details', href: `/admin/assessments/${quiz?.id}/quiz` },
        { label: 'Edit Quiz', isActive: true }
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/assessments/${quiz.id}/quiz`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quiz
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Quiz</h1>
            <p className="text-gray-600">SOC Code: {quiz.soc_code}</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="questions">Questions & Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Information</CardTitle>
            <CardDescription>
              Basic information about this SOC-based assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                placeholder="Describe what this assessment measures..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Settings</CardTitle>
            <CardDescription>
              Configure how this quiz is delivered to users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="questions_per_assessment">
                  Questions per Assessment *
                </Label>
                <Input
                  id="questions_per_assessment"
                  type="number"
                  min="1"
                  max={quiz.total_questions}
                  value={formData.questions_per_assessment}
                  onChange={(e) => handleInputChange('questions_per_assessment', parseInt(e.target.value))}
                  required
                />
                <p className="text-xs text-gray-500">
                  Max: {quiz.total_questions} total questions available
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estimated_minutes">Estimated Minutes *</Label>
                <Input
                  id="estimated_minutes"
                  type="number"
                  min="1"
                  value={formData.estimated_minutes}
                  onChange={(e) => handleInputChange('estimated_minutes', parseInt(e.target.value))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Total Questions</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                  <span className="text-sm">{quiz.total_questions}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Cannot be modified (set during generation)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Read-only Information</CardTitle>
            <CardDescription>
              These values are set during quiz generation and cannot be changed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SOC Code</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                  <span className="font-mono text-sm">{quiz.soc_code}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Company</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                  <span className="text-sm">{quiz.company?.name || 'Standard'}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>AI Generated</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                  <span className="text-sm">{quiz.ai_generated ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Created</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                  <span className="text-sm">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href={`/admin/assessments/${quiz.id}/quiz`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={saving}
            className="bg-[#114B5F] hover:bg-[#0d3a4a]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
        </TabsContent>

        <TabsContent value="questions">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Questions & Sections</CardTitle>
                <CardDescription>
                  Manage quiz sections and their questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sections.length > 0 ? (
                  <div className="space-y-4">
                    {sections.map((section, index) => (
                      <Card key={section.id} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{section.skill?.name || `Section ${index + 1}`}</CardTitle>
                              <CardDescription>
                                {section.questions?.length || 0} questions • {section.skill?.category}
                              </CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Question
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {section.questions && section.questions.length > 0 ? (
                            <div className="space-y-3">
                              {section.questions.map((question: any, qIndex: number) => (
                                <div key={question.id} className="border rounded p-3 bg-gray-50">
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="font-medium text-sm">Question {qIndex + 1}</span>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm">
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="text-red-600">
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700">{question.stem}</p>
                                  <div className="mt-2 flex gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {question.difficulty}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      Answer: {question.answer_key?.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No questions in this section</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No sections found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
