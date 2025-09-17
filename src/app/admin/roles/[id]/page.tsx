import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export default async function RoleDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const isNew = params.id === 'new'
  
  // Get the current user's profile to check permissions
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }
  
  // Get the user's profile with admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, admin_role, company_id')
    .eq('id', user.id)
    .single()
  
  // Only super admins and company admins can access this page
  const isSuperAdmin = profile?.admin_role === 'super_admin'
  const isCompanyAdmin = profile?.admin_role === 'company_admin'
  
  if (!isSuperAdmin && !isCompanyAdmin) {
    redirect('/admin')
  }
  
  // For new role, initialize with default values
  let role: any = null
  let companies: any[] = []
  
  if (!isNew) {
    // Get the role with related data
    const { data: roleData } = await supabase
      .from('jobs')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', params.id)
      .single()
    
    if (!roleData) {
      notFound()
    }
    
    // Check if user has permission to edit this role
    if (isCompanyAdmin && roleData.company_id !== profile.company_id) {
      redirect('/admin/roles')
    }
    
    role = {
      ...roleData,
      salary_min: roleData.salary_min ? roleData.salary_min / 100 : null,
      salary_max: roleData.salary_max ? roleData.salary_max / 100 : null
    }
  } else {
    // Initialize new role with default values
    role = {
      title: '',
      description: '',
      job_kind: 'featured_role',
      status: 'draft',
      is_featured: false,
      company_id: isCompanyAdmin ? profile.company_id : null,
      salary_min: null,
      salary_max: null,
      location: '',
      employment_type: 'full_time',
      experience_level: 'mid_level',
      education_requirement: 'bachelors',
      skills: [],
      responsibilities: '',
      benefits: ''
    }
  }
  
  // Get companies for the dropdown (only for super admin)
  if (isSuperAdmin) {
    const { data: companiesData } = await supabase
      .from('companies')
      .select('id, name')
      .order('name')
    
    companies = companiesData || []
  }
  
  // Get all skills for the skills selector
  const { data: skills } = await supabase
    .from('skills')
    .select('id, name, category')
    .order('name')
  
  // Define the form tabs and fields
  const tabs = [
    {
      id: 'basic',
      label: 'Basic Information',
      fields: [
        {
          key: 'title',
          label: 'Job Title',
          type: EntityFieldType.TEXT,
          required: true,
          placeholder: 'e.g., Senior Software Engineer'
        },
        {
          key: 'company_id',
          label: 'Company',
          type: EntityFieldType.SELECT,
          required: true,
          disabled: isCompanyAdmin, // Company admins can't change company
          options: [
            { value: '', label: 'Select a company' },
            ...companies.map(company => ({
              value: company.id,
              label: company.name
            }))
          ]
        },
        {
          key: 'job_kind',
          label: 'Role Type',
          type: EntityFieldType.SELECT,
          required: true,
          options: [
            { value: 'featured_role', label: 'Featured Role' },
            { value: 'occupation', label: 'High-Demand Occupation' }
          ]
        },
        {
          key: 'location',
          label: 'Location',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., Tampa, FL or Remote'
        },
        {
          key: 'employment_type',
          label: 'Employment Type',
          type: EntityFieldType.SELECT,
          options: [
            { value: 'full_time', label: 'Full-time' },
            { value: 'part_time', label: 'Part-time' },
            { value: 'contract', label: 'Contract' },
            { value: 'temporary', label: 'Temporary' },
            { value: 'internship', label: 'Internship' },
            { value: 'volunteer', label: 'Volunteer' }
          ]
        },
        {
          key: 'experience_level',
          label: 'Experience Level',
          type: EntityFieldType.SELECT,
          options: [
            { value: 'entry', label: 'Entry Level' },
            { value: 'mid_level', label: 'Mid Level' },
            { value: 'senior', label: 'Senior' },
            { value: 'lead', label: 'Lead' },
            { value: 'executive', label: 'Executive' }
          ]
        },
        {
          key: 'education_requirement',
          label: 'Education Requirement',
          type: EntityFieldType.SELECT,
          options: [
            { value: 'none', label: 'No formal education' },
            { value: 'high_school', label: 'High School' },
            { value: 'certificate', label: 'Certificate' },
            { value: 'associates', label: 'Associate\'s Degree' },
            { value: 'bachelors', label: 'Bachelor\'s Degree' },
            { value: 'masters', label: 'Master\'s Degree' },
            { value: 'doctorate', label: 'Doctorate' }
          ]
        },
        {
          key: 'salary_min',
          label: 'Minimum Salary',
          type: EntityFieldType.CURRENCY,
          placeholder: 'e.g., 50000',
          format: (value: number | null) => value ? formatCurrency(value) : '',
          parse: (value: string) => value ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : null
        },
        {
          key: 'salary_max',
          label: 'Maximum Salary',
          type: EntityFieldType.CURRENCY,
          placeholder: 'e.g., 120000',
          format: (value: number | null) => value ? formatCurrency(value) : '',
          parse: (value: string) => value ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : null
        }
      ]
    },
    {
      id: 'description',
      label: 'Job Description',
      fields: [
        {
          key: 'description',
          label: 'Job Description',
          type: EntityFieldType.TEXTAREA,
          required: true,
          placeholder: 'Enter a detailed job description...'
        },
        {
          key: 'responsibilities',
          label: 'Key Responsibilities',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'List the key responsibilities for this role...'
        },
        {
          key: 'requirements',
          label: 'Requirements',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'List the requirements for this role...'
        },
        {
          key: 'benefits',
          label: 'Benefits',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'List the benefits for this role...'
        }
      ]
    },
    {
      id: 'skills',
      label: 'Skills & Assessments',
      fields: [
        {
          key: 'skills',
          label: 'Required Skills',
          type: EntityFieldType.SELECT,
          multiple: true,
          options: skills?.map(skill => ({
            value: skill.id,
            label: skill.name,
            group: skill.category
          })) || [],
          placeholder: 'Select skills required for this role...'
        },
        {
          key: 'generate_skills',
          label: 'Generate Skills from Description',
          type: EntityFieldType.CUSTOM,
          render: () => (
            <Button 
              variant="outline" 
              className="w-full"
              // TODO: Implement AI skill generation
              onClick={() => {}}
            >
              🔍 Analyze Job Description & Suggest Skills
            </Button>
          )
        },
        {
          key: 'assessments',
          label: 'Skill Assessments',
          type: 'custom',
          render: () => (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Skill Assessments</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  // TODO: Implement assessment generation
                  onClick={() => {}}
                >
                  + Generate Assessments
                </Button>
              </div>
              
              {!isNew && role.assessments?.length > 0 ? (
                <div className="space-y-2">
                  {role.assessments.map((assessment: any) => (
                    <div key={assessment.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{assessment.skill_name} Assessment</h4>
                          <p className="text-sm text-muted-foreground">
                            {assessment.questions?.length || 0} questions
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm" className="text-destructive">
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    No assessments yet. Generate some based on the required skills.
                  </p>
                </div>
              )}
            </div>
          )
        }
      ]
    },
    {
      id: 'seo',
      label: 'SEO & Metadata',
      fields: [
        {
          key: 'seo_title',
          label: 'SEO Title',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., Senior Software Engineer Job at TechCorp | SkillSync',
          description: 'Title tag for search engines (50-60 characters)'
        },
        {
          key: 'meta_description',
          label: 'Meta Description',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'e.g., Join TechCorp as a Senior Software Engineer. Work on cutting-edge technologies in a collaborative environment. Apply now!',
          description: 'Brief summary for search results (150-160 characters)'
        },
        {
          key: 'slug',
          label: 'URL Slug',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., senior-software-engineer-techcorp',
          description: 'User-friendly URL for this job posting'
        }
      ]
    }
  ]
  
  // Handle form submission
  async function handleSave(updatedRole: any) {
    'use server'
    
    const supabase = createClient()
    
    // Convert salary back to cents for storage
    const roleToSave = {
      ...updatedRole,
      salary_min: updatedRole.salary_min ? Math.round(updatedRole.salary_min * 100) : null,
      salary_max: updatedRole.salary_max ? Math.round(updatedRole.salary_max * 100) : null,
      updated_at: new Date().toISOString()
    }
    
    if (isNew) {
      // Create new role
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          ...roleToSave,
          created_by: user?.id || '',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to create role: ${error.message}`)
      }
      
      return data
    } else {
      // Update existing role
      const { data, error } = await supabase
        .from('jobs')
        .update(roleToSave)
        .eq('id', params.id)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to update role: ${error.message}`)
      }
      
      return data
    }
  }
  
  // Handle publish action
  async function handlePublish(roleData: any) {
    'use server'
    
    const supabase = createClient()
    
    const { error } = await supabase
      .from('jobs')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', roleData.id)
    
    if (error) {
      throw new Error(`Failed to publish role: ${error.message}`)
    }
  }
  
  // Handle unpublish action
  async function handleUnpublish(roleData: any) {
    'use server'
    
    const supabase = createClient()
    
    const { error } = await supabase
      .from('jobs')
      .update({ 
        status: 'draft',
        published_at: null
      })
      .eq('id', roleData.id)
    
    if (error) {
      throw new Error(`Failed to unpublish role: ${error.message}`)
    }
  }
  
  // Handle feature toggle
  async function handleFeatureToggle(roleData: any, featured: boolean) {
    'use server'
    
    const supabase = createClient()
    
    const { error } = await supabase
      .from('jobs')
      .update({ 
        is_featured: featured,
        featured_at: featured ? new Date().toISOString() : null
      })
      .eq('id', roleData.id)
    
    if (error) {
      throw new Error(`Failed to update featured status: ${error.message}`)
    }
  }
  
  // Handle delete action
  async function handleDelete(roleData: any) {
    'use server'
    
    const supabase = createClient()
    
    // Soft delete by setting status to 'deleted' instead of actually deleting
    const { error } = await supabase
      .from('jobs')
      .update({ 
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq('id', roleData.id)
    
    if (error) {
      throw new Error(`Failed to delete role: ${error.message}`)
    }
  }
  
  return (
    <EntityDetailView
      entity={role}
      entityType="role"
      tabs={tabs as any}
      onSave={handleSave}
      onDelete={!isNew ? handleDelete : undefined}
      onPublish={!isNew ? handlePublish : undefined}
      onUnpublish={!isNew && role.status === 'published' ? handleUnpublish : undefined}
      onFeatureToggle={!isNew && isSuperAdmin ? handleFeatureToggle : undefined}
      isNew={isNew}
      backHref="/admin/roles"
      viewHref={!isNew ? `/jobs/${role.slug || role.id}` : undefined}
    />
  )
}
