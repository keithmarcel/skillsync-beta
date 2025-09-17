import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView'

export default async function OccupationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const isNew = params.id === 'new'
  
  let occupation = null
  
  if (!isNew) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .eq('job_kind', 'occupation')
      .single()
    
    if (error) {
      console.error('Error fetching occupation:', error)
      notFound()
    }
    
    occupation = data
  }

  // Define the form tabs and fields
  const tabs = [
    {
      id: 'basic',
      label: 'Basic Information',
      fields: [
        {
          key: 'title',
          label: 'Occupation Title',
          type: EntityFieldType.TEXT,
          required: true,
          placeholder: 'e.g., Software Developer'
        },
        {
          key: 'soc_code',
          label: 'SOC Code',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., 15-1252'
        },
        {
          key: 'category',
          label: 'Category',
          type: EntityFieldType.SELECT,
          options: [
            { value: 'technology', label: 'Technology' },
            { value: 'healthcare', label: 'Healthcare' },
            { value: 'finance', label: 'Finance' },
            { value: 'manufacturing', label: 'Manufacturing' },
            { value: 'education', label: 'Education' },
            { value: 'government', label: 'Government' },
            { value: 'retail', label: 'Retail' },
            { value: 'hospitality', label: 'Hospitality' },
            { value: 'construction', label: 'Construction' },
            { value: 'transportation', label: 'Transportation' },
            { value: 'other', label: 'Other' }
          ]
        },
        {
          key: 'location_city',
          label: 'Primary City',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., Tampa'
        },
        {
          key: 'location_state',
          label: 'Primary State',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., FL'
        }
      ]
    },
    {
      id: 'compensation',
      label: 'Compensation & Requirements',
      fields: [
        {
          key: 'median_wage_usd',
          label: 'Median Annual Salary (USD)',
          type: EntityFieldType.NUMBER,
          placeholder: 'e.g., 75000'
        },
        {
          key: 'required_proficiency_pct',
          label: 'Required Proficiency %',
          type: EntityFieldType.NUMBER,
          placeholder: 'e.g., 75',
          description: 'Minimum proficiency percentage required for this occupation'
        },
        {
          key: 'skills_count',
          label: 'Number of Skills',
          type: EntityFieldType.NUMBER,
          placeholder: 'e.g., 15',
          description: 'Total number of skills associated with this occupation'
        }
      ]
    },
    {
      id: 'description',
      label: 'Description',
      fields: [
        {
          key: 'long_desc',
          label: 'Occupation Description',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'Enter a detailed occupation description...'
        }
      ]
    }
  ]
  
  // Handle form submission
  async function handleSave(updatedOccupation: any) {
    'use server'
    const supabase = createClient()
    
    const occupationToSave = {
      title: updatedOccupation.title,
      soc_code: updatedOccupation.soc_code,
      category: updatedOccupation.category,
      location_city: updatedOccupation.location_city,
      location_state: updatedOccupation.location_state,
      median_wage_usd: updatedOccupation.median_wage_usd ? parseInt(updatedOccupation.median_wage_usd) : null,
      required_proficiency_pct: updatedOccupation.required_proficiency_pct ? parseInt(updatedOccupation.required_proficiency_pct) : null,
      skills_count: updatedOccupation.skills_count ? parseInt(updatedOccupation.skills_count) : null,
      long_desc: updatedOccupation.long_desc,
      job_kind: 'occupation',
      updated_at: new Date().toISOString()
    }
    
    if (isNew) {
      // Create new occupation
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          ...occupationToSave,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to create occupation: ${error.message}`)
      }
      
      return data
    } else {
      // Update existing occupation
      const { data, error } = await supabase
        .from('jobs')
        .update(occupationToSave)
        .eq('id', params.id)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to update occupation: ${error.message}`)
      }
      
      return data
    }
  }

  // Handle delete
  async function handleDelete(occupationId: string) {
    'use server'
    const supabase = createClient()
    
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', occupationId)
    
    if (error) {
      throw new Error(`Failed to delete occupation: ${error.message}`)
    }
  }
  
  return (
    <EntityDetailView
      entity={occupation}
      entityType="occupation"
      tabs={tabs as any}
      onSave={handleSave}
      onDelete={!isNew ? handleDelete : undefined}
      isNew={isNew}
      backHref="/admin/occupations"
      viewHref={!isNew ? `/jobs/${occupation?.id}` : undefined}
    />
  )
}
