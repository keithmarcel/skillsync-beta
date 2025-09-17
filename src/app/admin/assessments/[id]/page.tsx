import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView'

export default async function AssessmentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const isNew = params.id === 'new'
  
  let assessment = null
  let jobs = []
  
  // Fetch jobs for dropdown
  const { data: jobsData } = await supabase
    .from('jobs')
    .select('id, title')
    .order('title')
  
  jobs = jobsData || []
  
  if (!isNew) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) {
      console.error('Error fetching assessment:', error)
      notFound()
    }
    
    assessment = data
  }

  // Define the form tabs and fields
  const tabs = [
    {
      id: 'basic',
      label: 'Basic Information',
      fields: [
        {
          key: 'title',
          label: 'Assessment Title',
          type: EntityFieldType.TEXT,
          required: true,
          placeholder: 'e.g., JavaScript Fundamentals Quiz'
        },
        {
          key: 'job_id',
          label: 'Related Job/Occupation',
          type: EntityFieldType.SELECT,
          options: [
            { value: '', label: 'Select a job/occupation' },
            ...jobs.map(job => ({
              value: job.id,
              label: job.title
            }))
          ]
        },
        {
          key: 'difficulty_level',
          label: 'Difficulty Level',
          type: EntityFieldType.SELECT,
          required: true,
          options: [
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' }
          ]
        },
        {
          key: 'time_limit_minutes',
          label: 'Time Limit (minutes)',
          type: EntityFieldType.NUMBER,
          placeholder: 'e.g., 30'
        },
        {
          key: 'passing_score',
          label: 'Passing Score (%)',
          type: EntityFieldType.NUMBER,
          placeholder: 'e.g., 70'
        }
      ]
    },
    {
      id: 'description',
      label: 'Description',
      fields: [
        {
          key: 'description',
          label: 'Assessment Description',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'Enter a detailed assessment description...'
        }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      fields: [
        {
          key: 'is_active',
          label: 'Active',
          type: EntityFieldType.SWITCH,
          description: 'Make this assessment available to users'
        }
      ]
    }
  ]
  
  // Handle form submission
  async function handleSave(updatedAssessment: any) {
    'use server'
    const supabase = createClient()
    
    const assessmentToSave = {
      title: updatedAssessment.title,
      description: updatedAssessment.description,
      job_id: updatedAssessment.job_id || null,
      difficulty_level: updatedAssessment.difficulty_level,
      time_limit_minutes: updatedAssessment.time_limit_minutes ? parseInt(updatedAssessment.time_limit_minutes) : null,
      passing_score: updatedAssessment.passing_score ? parseInt(updatedAssessment.passing_score) : null,
      is_active: updatedAssessment.is_active || false,
      updated_at: new Date().toISOString()
    }
    
    if (isNew) {
      // Create new assessment
      const { data, error } = await supabase
        .from('assessments')
        .insert([{
          ...assessmentToSave,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to create assessment: ${error.message}`)
      }
      
      return data
    } else {
      // Update existing assessment
      const { data, error } = await supabase
        .from('assessments')
        .update(assessmentToSave)
        .eq('id', params.id)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to update assessment: ${error.message}`)
      }
      
      return data
    }
  }

  // Handle delete
  async function handleDelete(assessmentId: string) {
    'use server'
    const supabase = createClient()
    
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', assessmentId)
    
    if (error) {
      throw new Error(`Failed to delete assessment: ${error.message}`)
    }
  }

  // Handle feature toggle (active/inactive)
  async function handleFeatureToggle(assessmentId: string, active: boolean) {
    'use server'
    const supabase = createClient()
    
    const { error } = await supabase
      .from('assessments')
      .update({ is_active: active })
      .eq('id', assessmentId)
    
    if (error) {
      throw new Error(`Failed to update active status: ${error.message}`)
    }
  }
  
  return (
    <EntityDetailView
      entity={assessment}
      entityType="assessment"
      tabs={tabs as any}
      onSave={handleSave}
      onDelete={!isNew ? handleDelete : undefined}
      onFeatureToggle={!isNew ? handleFeatureToggle : undefined}
      isNew={isNew}
      backHref="/admin/assessments"
      viewHref={!isNew ? `/assessments/${assessment?.id}` : undefined}
    />
  )
}
