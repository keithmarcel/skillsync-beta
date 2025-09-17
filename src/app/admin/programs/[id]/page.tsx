import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView'

export default async function ProgramDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const isNew = params.id === 'new'
  
  let program = null
  let schools = []
  let cipCodes = []
  
  // Fetch schools for dropdown
  const { data: schoolsData } = await supabase
    .from('schools')
    .select('id, name')
    .order('name')
  
  schools = schoolsData || []

  // Fetch CIP codes for dropdown
  const { data: cipData } = await supabase
    .from('cip_codes')
    .select('cip_code, title')
    .order('cip_code')
  
  cipCodes = cipData || []
  
  if (!isNew) {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) {
      console.error('Error fetching program:', error)
      notFound()
    }
    
    program = data
  }

  // Define the form tabs and fields
  const tabs = [
    {
      id: 'basic',
      label: 'Basic Information',
      fields: [
        {
          key: 'name',
          label: 'Program Name',
          type: EntityFieldType.TEXT,
          required: true,
          placeholder: 'e.g., Computer Science - Associate of Science'
        },
        {
          key: 'school_id',
          label: 'Education Provider',
          type: EntityFieldType.SELECT,
          required: true,
          options: [
            { value: '', label: 'Select a provider' },
            ...schools.map(school => ({
              value: school.id,
              label: school.name
            }))
          ]
        },
        {
          key: 'program_type',
          label: 'Credential Type',
          type: EntityFieldType.SELECT,
          options: [
            { value: 'certificate', label: 'Certificate' },
            { value: 'diploma', label: 'Diploma' },
            { value: 'associates', label: 'Associate Degree' },
            { value: 'bachelors', label: 'Bachelor Degree' },
            { value: 'masters', label: 'Master Degree' },
            { value: 'doctorate', label: 'Doctorate' },
            { value: 'professional', label: 'Professional Certification' }
          ]
        },
        {
          key: 'format',
          label: 'Format',
          type: EntityFieldType.SELECT,
          options: [
            { value: 'online', label: 'Online' },
            { value: 'in_person', label: 'In-Person' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'self_paced', label: 'Self-Paced' }
          ]
        },
        {
          key: 'duration_text',
          label: 'Duration',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., 2 years, 18 months, 6 weeks'
        },
        {
          key: 'cip_code',
          label: 'CIP Code',
          type: EntityFieldType.SELECT,
          options: [
            { value: '', label: 'Select a CIP code' },
            ...cipCodes.map(cip => ({
              value: cip.cip_code,
              label: `${cip.cip_code} - ${cip.title}`
            }))
          ]
        }
      ]
    },
    {
      id: 'description',
      label: 'Program Details',
      fields: [
        {
          key: 'short_desc',
          label: 'Program Description',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'Enter a detailed program description...'
        },
        {
          key: 'program_url',
          label: 'Program Website',
          type: EntityFieldType.TEXT,
          placeholder: 'https://www.example.edu/programs/computer-science'
        }
      ]
    }
  ]
  
  // Handle form submission
  async function handleSave(updatedProgram: any) {
    'use server'
    const supabase = createClient()
    
    const programToSave = {
      name: updatedProgram.name,
      school_id: updatedProgram.school_id,
      program_type: updatedProgram.program_type,
      format: updatedProgram.format,
      duration_text: updatedProgram.duration_text,
      short_desc: updatedProgram.short_desc,
      program_url: updatedProgram.program_url,
      cip_code: updatedProgram.cip_code
    }
    
    if (isNew) {
      // Create new program
      const { data, error } = await supabase
        .from('programs')
        .insert([programToSave])
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to create program: ${error.message}`)
      }
      
      return data
    } else {
      // Update existing program
      const { data, error } = await supabase
        .from('programs')
        .update(programToSave)
        .eq('id', params.id)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to update program: ${error.message}`)
      }
      
      return data
    }
  }

  // Handle delete
  async function handleDelete(programId: string) {
    'use server'
    const supabase = createClient()
    
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId)
    
    if (error) {
      throw new Error(`Failed to delete program: ${error.message}`)
    }
  }
  
  return (
    <EntityDetailView
      entity={program}
      entityType="program"
      tabs={tabs as any}
      onSave={handleSave}
      onDelete={!isNew ? handleDelete : undefined}
      isNew={isNew}
      backHref="/admin/programs"
      viewHref={!isNew ? `/programs/${program?.id}` : undefined}
    />
  )
}
