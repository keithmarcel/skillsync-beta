'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import PageHeader from '@/components/ui/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { DestructiveDialog } from '@/components/ui/destructive-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { supabase } from '@/lib/supabase/client'
import type { Quiz } from '@/types/assessment'
import { ArrowLeft, Save } from 'lucide-react'
import { QuestionsTab } from '@/components/assessment/questions-tab'
import { AnalyticsTab } from '@/components/assessment/analytics-tab'

interface Role {
  id: string
  title: string
  soc_code: string | null
}

export default function AssessmentEditorPage() {
  const router = useRouter()
  const params = useParams()
  const { user, profile } = useAuth()
  const { toast } = useToast()
  
  const assessmentId = params.id as string
  const isNew = assessmentId === 'new'
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic-info')
  const [roles, setRoles] = useState<Role[]>([])
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [proficiencyThreshold, setProficiencyThreshold] = useState(90)
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [questionCount, setQuestionCount] = useState(0)
  
  // Dirty state tracking
  const [isDirty, setIsDirty] = useState(false)
  const [initialState, setInitialState] = useState<any>(null)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [assessmentId, profile])

  const loadData = async () => {
    if (!profile?.company_id) return
    
    try {
      setLoading(true)
      
      // Load company roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('jobs')
        .select('id, title, soc_code')
        .eq('company_id', profile.company_id)
        .eq('job_kind', 'featured_role')
        .order('title')
      
      if (rolesError) throw rolesError
      setRoles(rolesData || [])
      
      // If editing existing assessment, load it
      if (!isNew) {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', assessmentId)
          .single()
        
        if (quizError) {
          console.error('Error loading quiz:', quizError)
          toast({
            title: 'Error',
            description: 'Assessment not found',
            variant: 'destructive'
          })
          router.push('/employer?tab=assessments')
          return
        }
        
        // Load the associated job to verify company ownership
        if (quizData.job_id) {
          const { data: jobData, error: jobError } = await supabase
            .from('jobs')
            .select('id, title, company_id')
            .eq('id', quizData.job_id)
            .single()
          
          if (jobError) {
            console.error('Error loading job:', jobError)
          } else if (jobData.company_id !== profile.company_id) {
            toast({
              title: 'Access Denied',
              description: 'You do not have permission to edit this assessment',
              variant: 'destructive'
            })
            router.push('/employer?tab=assessments')
            return
          }
        }
        
        // Set form state
        setTitle(quizData.title || '')
        setDescription(quizData.description || '')
        setSelectedRoleId(quizData.job_id || '')
        setProficiencyThreshold(quizData.required_proficiency_pct || 90)
        setStatus(quizData.status || 'draft')
        
        // Load question count
        const { data: sections } = await supabase
          .from('quiz_sections')
          .select('id')
          .eq('quiz_id', assessmentId)
        
        if (sections && sections.length > 0) {
          const { count } = await supabase
            .from('quiz_questions')
            .select('*', { count: 'exact', head: true })
            .in('section_id', sections.map(s => s.id))
          
          setQuestionCount(count || 0)
        }
        
        // Store initial state for dirty checking
        setInitialState({
          title: quizData.title,
          description: quizData.description,
          job_id: quizData.job_id,
          required_proficiency_pct: quizData.required_proficiency_pct,
          status: quizData.status
        })
      } else {
        // New assessment - set defaults
        setInitialState({
          title: '',
          description: '',
          job_id: '',
          required_proficiency_pct: 90,
          status: 'draft'
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load assessment data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Check if form is dirty
  useEffect(() => {
    if (!initialState) return
    
    const currentState = {
      title: title.trim(),
      description: description.trim() || null,
      job_id: selectedRoleId,
      required_proficiency_pct: proficiencyThreshold,
      status
    }
    
    const hasChanges = JSON.stringify(currentState) !== JSON.stringify(initialState)
    setIsDirty(hasChanges)
  }, [title, description, selectedRoleId, proficiencyThreshold, status, initialState])

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Assessment title is required',
        variant: 'destructive'
      })
      return
    }
    
    if (!selectedRoleId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a role for this assessment',
        variant: 'destructive'
      })
      return
    }
    
    try {
      setSaving(true)
      
      const assessmentData = {
        title: title.trim(),
        description: description.trim() || null,
        job_id: selectedRoleId,
        required_proficiency_pct: proficiencyThreshold,
        status
      }
      
      if (isNew) {
        // Create new assessment
        const { data, error } = await supabase
          .from('quizzes')
          .insert(assessmentData)
          .select()
          .single()
        
        if (error) throw error
        
        toast({
          title: 'Success',
          description: 'Assessment created successfully'
        })
        
        // Redirect to edit page
        router.push(`/employer/assessments/${data.id}/edit`)
      } else {
        // Update existing assessment
        const { error } = await supabase
          .from('quizzes')
          .update(assessmentData)
          .eq('id', assessmentId)
        
        if (error) throw error
        
        toast({
          title: 'Success',
          description: 'Assessment updated successfully'
        })
        
        // Update initial state to match current form state
        setInitialState({
          title: title.trim(),
          description: description.trim() || null,
          job_id: selectedRoleId,
          required_proficiency_pct: proficiencyThreshold,
          status
        })
        setIsDirty(false)
      }
    } catch (error) {
      console.error('Error saving assessment:', error)
      toast({
        title: 'Error',
        description: 'Failed to save assessment',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    console.log('🔙 Back button clicked, isDirty:', isDirty)
    if (isDirty) {
      console.log('📝 Showing unsaved changes dialog')
      setShowUnsavedDialog(true)
      return
    }
    console.log('✅ Navigating back to assessments')
    router.push('/employer?tab=assessments')
  }

  const confirmLeave = () => {
    setShowUnsavedDialog(false)
    router.push('/employer?tab=assessments')
  }

  const saveAndLeave = async () => {
    await handleSave()
    if (!saving) {
      setShowUnsavedDialog(false)
      router.push('/employer?tab=assessments')
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', assessmentId)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Assessment deleted successfully'
      })
      
      router.push('/employer?tab=assessments')
    } catch (error) {
      console.error('Error deleting assessment:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete assessment',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size={80} text="Loading Assessment" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-[1280px] mx-auto px-6 space-y-6">
        {/* Back link */}
        <div className="py-3">
          <button 
            onClick={handleBack}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assessments
          </button>
        </div>
        
        {/* Header with title and actions */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? 'Create Assessment' : `Edit: ${title}`}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {!isNew && (
              <Button
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleting}
                variant="outline"
                className="flex h-9 px-3 py-2 items-center gap-2 rounded-lg border border-red-500 bg-transparent text-red-500 hover:bg-red-500 hover:text-white"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            
            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex h-9 px-3 py-2 items-center gap-2 rounded-lg bg-[#0694A2] hover:bg-[#047481] text-white"
            >
              {saving ? (
                <>
                  <LoadingSpinner size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs and content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
            <TabsTrigger value="questions" disabled={isNew}>Questions</TabsTrigger>
            <TabsTrigger value="analytics" disabled={isNew}>Analytics</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic-info">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Assessment Details</h2>
                <div className="flex items-center gap-3">
                  {isDirty && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Unsaved Changes
                    </Badge>
                  )}
                  <Badge 
                    variant="outline"
                    className={status === 'published' ? 'bg-green-50 text-green-700 border-green-200 rounded' : 'bg-yellow-50 text-yellow-700 border-yellow-200 rounded'}
                  >
                    {status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Assessment Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Mechanical Project Manager Assessment"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Give your assessment a clear, descriptive title
                  </p>
                </div>

                {/* Role Selection */}
                <div>
                  <Label htmlFor="role">Associated Role *</Label>
                  <select
                    id="role"
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select a role...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.title} {role.soc_code && `(${role.soc_code})`}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Select the role this assessment evaluates
                  </p>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this assessment evaluates..."
                    rows={4}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Optional: Provide context about this assessment
                  </p>
                </div>

                {/* Required Proficiency */}
                <div>
                  <Label htmlFor="threshold">Required Proficiency</Label>
                  <div className="flex items-center gap-4 mt-1">
                    <Input
                      id="threshold"
                      type="number"
                      min="60"
                      max="100"
                      value={proficiencyThreshold}
                      onChange={(e) => setProficiencyThreshold(parseInt(e.target.value) || 90)}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">%</span>
                    <span className="text-sm text-gray-500">
                      Minimum score required to be considered qualified for this role
                    </span>
                  </div>
                </div>

                {/* Status Toggle */}
                {!isNew && (
                  <div>
                    <Label>Status</Label>
                    <TooltipProvider delayDuration={100}>
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => setStatus('draft')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            status === 'draft'
                              ? 'bg-gray-100 text-gray-900 border-2 border-gray-300'
                              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Draft
                        </button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                if (questionCount < 5) {
                                  toast({
                                    title: 'Cannot Publish',
                                    description: 'Assessment must have at least 5 questions before publishing',
                                    variant: 'destructive'
                                  })
                                  return
                                }
                                setStatus('published')
                              }}
                              disabled={questionCount < 5}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                status === 'published'
                                  ? 'bg-green-100 text-green-900 border-2 border-green-300'
                                  : questionCount < 5
                                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              Publish
                            </button>
                          </TooltipTrigger>
                          {questionCount < 5 && (
                            <TooltipContent side="top">
                              <p>Add {5 - questionCount} more question{5 - questionCount === 1 ? '' : 's'} to publish</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                )}
              </div>

            </div>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <QuestionsTab 
              quizId={assessmentId} 
              jobId={selectedRoleId}
              onQuestionCountChange={setQuestionCount}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab quizId={assessmentId} isAdmin={false} />
          </TabsContent>
        </Tabs>

        {/* Unsaved Changes Dialog */}
        <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unsaved Changes</DialogTitle>
              <DialogDescription>
                You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={confirmLeave}
                className="border-red-600 text-red-700 hover:bg-red-600 hover:text-white"
              >
                Leave Without Saving
              </Button>
              <Button 
                onClick={saveAndLeave}
                disabled={saving}
                className="flex h-9 px-3 py-2 items-center gap-2 rounded-lg bg-[#0694A2] hover:bg-[#047481] text-white"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size={16} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <DestructiveDialog
            title="Delete Assessment"
            description="Are you sure you want to delete this assessment? This action cannot be undone. All questions and analytics data will be permanently deleted."
            actionLabel="Delete Assessment"
            onConfirm={handleDelete}
            onError={() => setShowDeleteDialog(false)}
          >
            <div />
          </DestructiveDialog>
        )}
      </div>
    </div>
  )
}
