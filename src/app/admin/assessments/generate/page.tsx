'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, BookOpen, Target, Users, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

interface Quiz {
  id: string
  soc_code: string
  title: string
  status: 'draft' | 'published' | 'archived'
  total_questions: number
  questions_per_assessment: number
  is_standard: boolean
  created_at: string
}

interface JobWithSoc {
  soc_code: string
  title: string
  count: number
}

export default function GenerateAssessmentPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [availableSocs, setAvailableSocs] = useState<JobWithSoc[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [socCode, setSocCode] = useState('')
  const [companyId, setCompanyId] = useState('')

  // Load existing quizzes and available SOC codes
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load existing quizzes
      const quizResponse = await fetch('/api/quizzes')
      const quizData = await quizResponse.json()
      setQuizzes(quizData.quizzes || [])

      // Load available SOC codes from jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('soc_code, title')
        .not('soc_code', 'is', null)

      // Group by SOC code and count
      const socMap = new Map<string, { title: string, count: number }>()
      jobs?.forEach((job: any) => {
        if (job.soc_code) {
          const existing = socMap.get(job.soc_code)
          if (existing) {
            existing.count++
          } else {
            socMap.set(job.soc_code, { title: job.title, count: 1 })
          }
        }
      })

      const socList = Array.from(socMap.entries()).map(([soc_code, data]) => ({
        soc_code,
        title: data.title,
        count: data.count
      }))

      setAvailableSocs(socList)

    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load assessment data')
    } finally {
      setLoading(false)
    }
  }

  const generateQuiz = async () => {
    if (!socCode.trim()) {
      toast.error('SOC code is required')
      return
    }

    setGenerating(true)
    try {
      // Try to populate skills first (optional enhancement)
      try {
        toast.info('Enhancing with O*NET data...')

        const populateResponse = await fetch('/api/admin/populate-job-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ socCode: socCode.trim() })
        })

        const populateData = await populateResponse.json()

        if (populateData.success && populateData.total_skills_added > 0) {
          toast.success(`Enhanced with ${populateData.total_skills_added} real skills from O*NET!`)
        } else {
          toast.info('Using existing skills data (O*NET enhancement optional)')
        }
      } catch (populateError) {
        console.warn('O*NET population failed, continuing with existing skills:', populateError)
        toast.info('Using existing skills data (API enhancement optional)')
      }

      // Generate the quiz regardless of skill population success
      toast.info('Generating AI assessment...')

      const response = await fetch('/api/quizzes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socCode: socCode.trim(),
          companyId: companyId || null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Assessment quiz generated successfully!')
        setSocCode('')
        setCompanyId('')
        loadData() // Refresh the list
      } else {
        toast.error(data.error || 'Failed to generate assessment')
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error)
      toast.error('Failed to generate assessment')
    } finally {
      setGenerating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      published: 'default',
      archived: 'outline'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Generate AI Assessment
          </h1>
        </div>
        <p className="text-gray-600">
          Create comprehensive skill assessments using SOC codes and AI-powered question generation
        </p>
      </div>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            SOC-Based Assessment Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="socCode">SOC Code *</Label>
              <Select value={socCode} onValueChange={setSocCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SOC code..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSocs.map((soc) => (
                    <SelectItem key={soc.soc_code} value={soc.soc_code}>
                      {soc.soc_code} - {soc.title} ({soc.count} job{soc.count !== 1 ? 's' : ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Standard Occupational Classification code for job matching
              </p>
            </div>

            <div>
              <Label htmlFor="companyId">Company (Optional)</Label>
              <Input
                id="companyId"
                placeholder="Company ID for custom assessment"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty for standard O*NET assessment
              </p>
            </div>
          </div>

          {/* Generation Process Explanation */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">What happens when you generate:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div>• AI analyzes SOC code and related job skills</div>
              <div>• Generates 40+ contextual questions (8-10 per skill)</div>
              <div>• Creates reusable assessment for all matching jobs</div>
              <div>• Includes proficiency levels and question rotation</div>
            </div>
          </div>

          <Button
            onClick={generateQuiz}
            disabled={generating || !socCode.trim()}
            className="w-full md:w-auto"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Assessment...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate AI Assessment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No assessments generated yet. Create your first AI assessment above!
            </p>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium">{quiz.title}</h3>
                      {getStatusBadge(quiz.status)}
                      {quiz.is_standard && (
                        <Badge variant="outline">Standard</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      SOC {quiz.soc_code} • {quiz.total_questions} questions •
                      {quiz.questions_per_assessment} per assessment
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created {new Date(quiz.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold">{quizzes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold">
                  {quizzes.filter(q => q.status === 'published').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">SOC Codes Available</p>
                <p className="text-2xl font-bold">{availableSocs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Standard Assessments</p>
                <p className="text-2xl font-bold">
                  {quizzes.filter(q => q.is_standard).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
