'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Sparkles, AlertCircle, CheckCircle, Search } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/breadcrumb'

interface SocCodeWithSkills {
  soc_code: string
  job_count: number
  skill_count: number
  title: string
}

export default function GenerateAssessmentPage() {
  const router = useRouter()
  const [availableSocCodes, setAvailableSocCodes] = useState<SocCodeWithSkills[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [socCode, setSocCode] = useState('')
  const [companyId, setCompanyId] = useState('')

  useEffect(() => {
    loadAvailableSocCodes()
  }, [])

  const loadAvailableSocCodes = async () => {
    try {
      setLoading(true)
      
      // Get SOC codes that have jobs with skills
      const { data, error } = await supabase
        .from('job_skills')
        .select(`
          jobs!inner(soc_code, title),
          skills(name)
        `)
        .order('jobs(soc_code)')

      if (error) throw error

      // Group by SOC code and count skills
      const socCodeMap = new Map<string, SocCodeWithSkills>()
      
      data?.forEach((item: any) => {
        const socCode = item.jobs.soc_code
        const title = item.jobs.title
        
        if (!socCodeMap.has(socCode)) {
          socCodeMap.set(socCode, {
            soc_code: socCode,
            title: title,
            job_count: 0,
            skill_count: 0
          })
        }
        
        const entry = socCodeMap.get(socCode)!
        entry.skill_count++
      })

      // Count jobs per SOC code
      const jobCounts = await supabase
        .from('jobs')
        .select('soc_code')
        .not('soc_code', 'is', null)

      jobCounts.data?.forEach((job: any) => {
        if (job.soc_code && socCodeMap.has(job.soc_code)) {
          socCodeMap.get(job.soc_code)!.job_count++
        }
      })

      setAvailableSocCodes(Array.from(socCodeMap.values()).sort((a, b) => 
        b.skill_count - a.skill_count
      ))
      
    } catch (err) {
      console.error('Error loading available SOC codes:', err)
      toast.error('Failed to load available SOC codes')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!socCode.trim()) {
      toast.error('Please select a SOC code')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/quizzes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          socCode: socCode.trim(),
          companyId: companyId || undefined 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to generate quiz')
      }

      toast.success(`Quiz generated successfully!`)
      
      // Redirect to the quiz detail page
      router.push(`/admin/assessments/${result.quizId}/quiz`)
      
    } catch (err) {
      console.error('Error generating quiz:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to generate quiz')
    } finally {
      setGenerating(false)
    }
  }

  const selectSocCode = (selectedSocCode: string) => {
    setSocCode(selectedSocCode)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb items={[
        { label: 'Admin', href: '/admin' },
        { label: 'Assessments', href: '/admin/assessments' },
        { label: 'Generate New Quiz', isActive: true }
      ]} />

      <div>
        <h1 className="text-3xl font-bold">Generate New Assessment</h1>
        <p className="text-gray-600">Create SOC-based assessment quizzes from job skills data</p>
      </div>

      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          <strong>SOC-Specific Assessments:</strong> Quizzes can only be generated for SOC codes that have associated job skills. 
          This ensures assessments are based on real occupational requirements, not generic questions.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>SOC Code Selection</CardTitle>
          <CardDescription>
            Select a SOC code that has job skills defined. Only SOC codes with skills can generate meaningful assessments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="socCode">SOC Code</Label>
              <Input
                id="socCode"
                placeholder="e.g., 13-1082"
                value={socCode}
                onChange={(e) => setSocCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={handleGenerateQuiz}
                disabled={generating || !socCode.trim()}
                className="w-full bg-[#114B5F] hover:bg-[#0d3a4a]"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Assessment...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Assessment
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Available SOC Codes with Skills
          </CardTitle>
          <CardDescription>
            SOC codes that have jobs with associated skills and can generate assessments ({availableSocCodes.length} available)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableSocCodes.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No SOC Codes Available</h3>
              <p className="text-gray-600 mb-4">
                No SOC codes with associated job skills were found. You need to populate job skills data before generating assessments.
              </p>
              <p className="text-sm text-gray-500">
                Import seed data or manually add job skills to enable assessment generation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSocCodes.map((item) => (
                <Card 
                  key={item.soc_code}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    socCode === item.soc_code ? 'ring-2 ring-[#114B5F] bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => selectSocCode(item.soc_code)}
                >
                  <CardContent className="p-4">
                    <div className="font-mono text-sm font-semibold text-[#114B5F] mb-1">
                      {item.soc_code}
                    </div>
                    <div className="text-sm font-medium mb-2 line-clamp-2">
                      {item.title}
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{item.skill_count} skills</span>
                      <span>{item.job_count} jobs</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
