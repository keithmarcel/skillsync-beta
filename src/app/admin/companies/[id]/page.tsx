import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView'

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const isNew = params.id === 'new'
  
  let company = null
  
  if (!isNew) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) {
      console.error('Error fetching company:', error)
      notFound()
    }
    
    company = data
  }

  // Define the form tabs and fields
  const tabs = [
    {
      id: 'basic',
      label: 'Basic Information',
      fields: [
        {
          key: 'name',
          label: 'Company Name',
          type: EntityFieldType.TEXT,
          required: true,
          placeholder: 'e.g., TechCorp Inc.'
        },
        {
          key: 'industry',
          label: 'Industry',
          type: EntityFieldType.SELECT,
          options: [
            { value: 'technology', label: 'Technology' },
            { value: 'healthcare', label: 'Healthcare' },
            { value: 'finance', label: 'Finance' },
            { value: 'manufacturing', label: 'Manufacturing' },
            { value: 'retail', label: 'Retail' },
            { value: 'education', label: 'Education' },
            { value: 'government', label: 'Government' },
            { value: 'nonprofit', label: 'Non-profit' },
            { value: 'other', label: 'Other' }
          ]
        },
        {
          key: 'hq_city',
          label: 'Headquarters City',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., Tampa'
        },
        {
          key: 'hq_state',
          label: 'Headquarters State',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., FL'
        },
        {
          key: 'employee_range',
          label: 'Employee Count',
          type: EntityFieldType.SELECT,
          options: [
            { value: '1-10', label: '1-10 employees' },
            { value: '11-50', label: '11-50 employees' },
            { value: '51-200', label: '51-200 employees' },
            { value: '201-500', label: '201-500 employees' },
            { value: '501-1000', label: '501-1000 employees' },
            { value: '1000+', label: '1000+ employees' }
          ]
        },
        {
          key: 'revenue_range',
          label: 'Revenue Range',
          type: EntityFieldType.SELECT,
          options: [
            { value: 'under_1m', label: 'Under $1M' },
            { value: '1m_10m', label: '$1M - $10M' },
            { value: '10m_50m', label: '$10M - $50M' },
            { value: '50m_100m', label: '$50M - $100M' },
            { value: '100m_500m', label: '$100M - $500M' },
            { value: '500m_1b', label: '$500M - $1B' },
            { value: '1b_plus', label: '$1B+' }
          ]
        }
      ]
    },
    {
      id: 'description',
      label: 'Company Profile',
      fields: [
        {
          key: 'bio',
          label: 'Company Description',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'Enter a detailed company description...'
        }
      ]
    },
    {
      id: 'media',
      label: 'Media & Branding',
      fields: [
        {
          key: 'logo_url',
          label: 'Company Logo',
          type: EntityFieldType.IMAGE,
          placeholder: 'Upload company logo'
        },
        {
          key: 'company_image_url',
          label: 'Company Image',
          type: EntityFieldType.IMAGE,
          placeholder: 'Upload company profile image'
        }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      fields: [
        {
          key: 'is_trusted_partner',
          label: 'Trusted Partner',
          type: EntityFieldType.SWITCH,
          description: 'Mark as a trusted partner to display special badge'
        }
      ]
    }
  ]
  
  // Handle form submission
  async function handleSave(updatedCompany: any) {
    'use server'
    const supabase = createClient()
    
    const companyToSave = {
      name: updatedCompany.name,
      industry: updatedCompany.industry,
      hq_city: updatedCompany.hq_city,
      hq_state: updatedCompany.hq_state,
      employee_range: updatedCompany.employee_range,
      revenue_range: updatedCompany.revenue_range,
      bio: updatedCompany.bio,
      logo_url: updatedCompany.logo_url,
      company_image_url: updatedCompany.company_image_url,
      is_trusted_partner: updatedCompany.is_trusted_partner || false,
      updated_at: new Date().toISOString()
    }
    
    if (isNew) {
      // Create new company
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          ...companyToSave,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to create company: ${error.message}`)
      }
      
      return data
    } else {
      // Update existing company
      const { data, error } = await supabase
        .from('companies')
        .update(companyToSave)
        .eq('id', params.id)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to update company: ${error.message}`)
      }
      
      return data
    }
  }

  // Handle delete
  async function handleDelete(companyId: string) {
    'use server'
    const supabase = createClient()
    
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId)
    
    if (error) {
      throw new Error(`Failed to delete company: ${error.message}`)
    }
  }

  // Handle feature toggle
  async function handleFeatureToggle(companyId: string, featured: boolean) {
    'use server'
    const supabase = createClient()
    
    const { error } = await supabase
      .from('companies')
      .update({ is_trusted_partner: featured })
      .eq('id', companyId)
    
    if (error) {
      throw new Error(`Failed to update featured status: ${error.message}`)
    }
  }
  
  return (
    <EntityDetailView
      entity={company}
      entityType="company"
      tabs={tabs as any}
      onSave={handleSave}
      onDelete={!isNew ? handleDelete : undefined}
      onFeatureToggle={!isNew ? handleFeatureToggle : undefined}
      isNew={isNew}
      backHref="/admin/companies"
      viewHref={!isNew ? `/companies/${company?.id}` : undefined}
    />
  )
}
