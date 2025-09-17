import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView'

export default async function ProviderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const isNew = params.id === 'new'
  
  let provider = null
  
  if (!isNew) {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) {
      console.error('Error fetching provider:', error)
      notFound()
    }
    
    provider = data
  }

  // Define the form tabs and fields
  const tabs = [
    {
      id: 'basic',
      label: 'Basic Information',
      fields: [
        {
          key: 'name',
          label: 'Provider Name',
          type: EntityFieldType.TEXT,
          required: true,
          placeholder: 'e.g., University of South Florida'
        },
        {
          key: 'city',
          label: 'City',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., Tampa'
        },
        {
          key: 'state',
          label: 'State',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., FL'
        },
        {
          key: 'about_url',
          label: 'Website URL',
          type: EntityFieldType.TEXT,
          placeholder: 'https://www.example.edu'
        }
      ]
    },
    {
      id: 'media',
      label: 'Media & Branding',
      fields: [
        {
          key: 'logo_url',
          label: 'Provider Logo',
          type: EntityFieldType.IMAGE,
          placeholder: 'Upload provider logo'
        }
      ]
    }
  ]
  
  // Handle form submission
  async function handleSave(updatedProvider: any) {
    'use server'
    const supabase = createClient()
    
    const providerToSave = {
      name: updatedProvider.name,
      city: updatedProvider.city,
      state: updatedProvider.state,
      about_url: updatedProvider.about_url,
      logo_url: updatedProvider.logo_url
    }
    
    if (isNew) {
      // Create new provider
      const { data, error } = await supabase
        .from('schools')
        .insert([providerToSave])
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to create provider: ${error.message}`)
      }
      
      return data
    } else {
      // Update existing provider
      const { data, error } = await supabase
        .from('schools')
        .update(providerToSave)
        .eq('id', params.id)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to update provider: ${error.message}`)
      }
      
      return data
    }
  }

  // Handle delete
  async function handleDelete(providerId: string) {
    'use server'
    const supabase = createClient()
    
    const { error } = await supabase
      .from('schools')
      .delete()
      .eq('id', providerId)
    
    if (error) {
      throw new Error(`Failed to delete provider: ${error.message}`)
    }
  }
  
  return (
    <EntityDetailView
      entity={provider}
      entityType="provider"
      tabs={tabs as any}
      onSave={handleSave}
      onDelete={!isNew ? handleDelete : undefined}
      isNew={isNew}
      backHref="/admin/providers"
      viewHref={!isNew ? `/providers/${provider?.id}` : undefined}
    />
  )
}
