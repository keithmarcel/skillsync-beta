'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function NewAssessmentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { profile } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Array<{ id: string; title: string }>>([])
  const [formData, setFormData] = useState({
    title: '',
    jobId: '',
    description: '',
    proficiencyThreshold: 90
  })

  useEffect(() => {
    loadRoles()
  }, [profile])

  const loadRoles = async () => {
    if (!profile?.company_id) return

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('company_id', profile.company_id)
        .eq('job_kind', 'featured_role')
        .order('title')

      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error('Error loading roles:', error)
      toast({
        title: 'Error',
        description: 'Failed to load roles',
        variant: 'destructive'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.jobId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: formData.title,
          job_id: formData.jobId,
          description: formData.description || null,
          required_proficiency_pct: formData.proficiencyThreshold,
          status: 'draft'
        })
        .select()
        .single()

      if (quizError) throw quizError

      // Create default section
      const { error: sectionError } = await supabase
        .from('quiz_sections')
        .insert({
          quiz_id: quiz.id,
          skill_id: null,
          display_order: 1
        })

      if (sectionError) throw sectionError

      toast({
        title: 'Success',
        description: 'Assessment created successfully'
      })

      // Navigate to edit page
      router.push(`/employer/assessments/${quiz.id}/edit`)
    } catch (error) {
      console.error('Error creating assessment:', error)
      toast({
        title: 'Error',
        description: 'Failed to create assessment',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/employer?tab=assessments')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assessments
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Assessment</h1>
          <p className="text-gray-600 mt-2">
            Set up a new assessment to evaluate candidates for your roles
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">
                  Assessment Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Mechanical Project Manager Assessment"
                  className="mt-1"
                  required
                />
              </div>

              {/* Role Selection */}
              <div>
                <Label htmlFor="role">
                  Associated Role <span className="text-red-500">*</span>
                </Label>
                <select
                  id="role"
                  value={formData.jobId}
                  onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0694A2]"
                  required
                >
                  <option value="">Select a role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  This assessment will be used to evaluate candidates for this role
                </p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this assessment evaluates..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Required Proficiency */}
              <div>
                <Label htmlFor="threshold">
                  Required Proficiency
                </Label>
                <div className="flex items-center gap-4 mt-1">
                  <input
                    type="range"
                    id="threshold"
                    min="60"
                    max="100"
                    step="5"
                    value={formData.proficiencyThreshold}
                    onChange={(e) => setFormData({ ...formData, proficiencyThreshold: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-lg font-semibold text-gray-900 w-16 text-right">
                    {formData.proficiencyThreshold}%
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Minimum score required to be considered qualified for this role
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/employer?tab=assessments')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#0694A2] hover:bg-[#047481] text-white"
                >
                  {loading ? 'Creating...' : 'Create Assessment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
