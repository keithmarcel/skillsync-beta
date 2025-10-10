'use client';

import { useRouter } from 'next/navigation';
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { useAdminEntity } from '@/hooks/useAdminEntity';
import { useCompaniesList } from '@/hooks/useCompaniesList';
import { useSkillsList } from '@/hooks/useSkillsList';
import { useAuth } from '@/hooks/useAuth';
import { SocAutoSuggest } from '@/components/admin/soc-auto-suggest';
import type { Job } from '@/lib/database/queries';

export default function RoleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { profile, isCompanyAdmin, isSuperAdmin } = useAuth();
  const { 
    entity: role, 
    isLoading: isLoadingRole, 
    error: roleError, 
    handleSave, 
    handleDelete 
  } = useAdminEntity<Job>('jobs', params.id === 'new' ? null : params.id);
  
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();
  const { skills, isLoading: isLoadingSkills } = useSkillsList();

  const isNew = params.id === 'new';
  const isLoading = isLoadingRole || isLoadingCompanies || isLoadingSkills;

  const defaultRole: Job = {
    id: '',
    title: '',
    job_kind: 'featured_role',
    status: 'draft',
    is_featured: false,
    company_id: isCompanyAdmin ? profile?.company_id || null : null,
    soc_code: null,
    job_type: null,
    category: '',
    location_city: null,
    location_state: null,
    median_wage_usd: null,
    short_desc: null,
    long_desc: null,
    featured_image_url: null,
    skills_count: 0,
    employment_outlook: null,
    education_level: null,
    work_experience: null,
    on_job_training: null,
    job_openings_annual: null,
    growth_rate_percent: null,
    required_proficiency_pct: null,
    // O*NET enrichment fields
    core_responsibilities: null,
    tasks: null,
    tools_and_technology: null,
    related_job_titles: null,
    onet_code: null,
    bright_outlook: null,
    bright_outlook_category: null,
    video_url: null,
    // Work location
    work_location_type: null,
    // Legacy company-specific fields (may remove later)
    growth_opportunities: null,
    team_structure: null,
    work_environment: null,
    travel_requirements: null,
    performance_metrics: null,
    training_provided: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
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
          placeholder: 'Select a company',
          options: companies.map(company => ({
            value: company.id,
            label: company.name
          }))
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
          key: 'category',
          label: 'Category',
          type: EntityFieldType.SELECT,
          required: true,
          placeholder: 'Select a category',
          options: [
            { value: 'Business', label: 'Business' },
            { value: 'Health & Education', label: 'Health & Education' },
            { value: 'Tech & Services', label: 'Tech & Services' },
            { value: 'Finance & Legal', label: 'Finance & Legal' },
            { value: 'Skilled Trades', label: 'Skilled Trades' },
            { value: 'Logistics', label: 'Logistics' },
            { value: 'Hospitality', label: 'Hospitality' },
            { value: 'Public Services', label: 'Public Services' }
          ]
        },
        {
          key: 'location',
          label: 'Location',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., Tampa, FL or Remote'
        },
        {
          key: 'job_type',
          label: 'Employment Type',
          type: EntityFieldType.SELECT,
          placeholder: 'Select employment type',
          options: [
            { value: 'Full-time', label: 'Full-time' },
            { value: 'Part-time', label: 'Part-time' },
            { value: 'Contract', label: 'Contract' },
            { value: 'Temporary', label: 'Temporary' },
            { value: 'Internship', label: 'Internship' },
            { value: 'Volunteer', label: 'Volunteer' }
          ]
        },
        {
          key: 'work_location_type',
          label: 'Work Location',
          type: EntityFieldType.SELECT,
          placeholder: 'Select work arrangement',
          description: 'Where will this role be performed?',
          options: [
            { value: 'Onsite', label: 'Onsite' },
            { value: 'Remote', label: 'Remote' },
            { value: 'Hybrid', label: 'Hybrid' }
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
          key: 'median_wage_usd',
          label: 'Median Salary',
          type: EntityFieldType.CURRENCY,
          placeholder: 'e.g., 75000',
          description: 'Displayed on role cards and detail page',
          format: (value: number | null) => value ? formatCurrency(value) : '',
          parse: (value: string) => value ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : null
        },
        {
          key: 'soc_code',
          label: 'SOC Code',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., 13-1082',
          description: 'Standard Occupational Classification code for government compliance'
        },
        {
          key: 'soc_suggest',
          label: 'AI SOC Suggestion',
          type: EntityFieldType.CUSTOM,
          description: 'Get AI-powered SOC code recommendations based on job title and description',
          component: ({ entity, field }: any) => {
            // Find the soc_code field to update it
            const handleAccept = (socCode: string) => {
              // Update the form data through the entity
              const event = new Event('input', { bubbles: true })
              const socInput = document.querySelector('input[name="soc_code"]') as HTMLInputElement
              if (socInput) {
                socInput.value = socCode
                socInput.dispatchEvent(event)
              }
            }
            
            return (
              <SocAutoSuggest
                jobTitle={entity.title || ''}
                jobDescription={entity.long_desc || entity.description || ''}
                onAccept={handleAccept}
                disabled={!entity.title}
              />
            )
          }
        }
      ]
    },
    {
      id: 'description',
      label: 'Descriptions',
      fields: [
        {
          key: 'short_desc',
          label: 'Short Description (for cards)',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'Enter a brief description (13-15 words, ~95 characters)',
          description: 'This appears on role cards in listings',
          helpText: 'Keep it concise and compelling - this is the first thing users see'
        },
        {
          key: 'long_desc',
          label: 'Full Job Description',
          type: EntityFieldType.TEXTAREA,
          required: true,
          placeholder: 'Enter a detailed job description...',
          description: 'This appears on the role detail page'
        }
      ]
    },
    {
      id: 'skills',
      label: 'Skills',
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
      ]
    },
    {
      id: 'assessments',
      label: 'Assessments',
      fields: [
        {
          key: 'assessment_info',
          label: 'Role Assessment',
          type: EntityFieldType.CUSTOM,
          render: () => (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Assessment Management</h3>
              <p className="text-sm text-gray-600 mb-4">
                View and manage the skills assessment for this role. The assessment is automatically generated based on the required skills.
              </p>
              <Button variant="outline" className="w-full">
                View/Edit Assessment Questions
              </Button>
            </div>
          )
        }
      ]
    },
    {
      id: 'role_details',
      label: 'Role Details (O*NET Data)',
      fields: [
        {
          key: 'core_responsibilities',
          label: 'Core Responsibilities',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'Enter core responsibilities (from O*NET or custom)...',
          description: 'These appear as cards on the role detail page',
          helpText: '🔜 Future: This will be a drag-and-drop card editor'
        },
        {
          key: 'tasks_note',
          label: 'Day-to-Day Tasks',
          type: EntityFieldType.CUSTOM,
          render: () => (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📝 <strong>Note:</strong> Day-to-day tasks are automatically populated from O*NET data. Card-based editor coming soon.
              </p>
            </div>
          )
        },
        {
          key: 'tools_note',
          label: 'Tools & Technology',
          type: EntityFieldType.CUSTOM,
          render: () => (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                🔧 <strong>Note:</strong> Tools & technology are automatically populated from O*NET data. Card-based editor coming soon.
              </p>
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
  
  const onSave = async (updatedData: Partial<Job>) => {
    const savedRole = await handleSave(updatedData);
    if (savedRole && isNew) {
      router.push(`/admin/roles/${savedRole.id}`);
    }
  };

  const onDelete = async () => {
    const success = await handleDelete();
    if (success) {
      router.push('/admin/roles');
    }
  };

  const onPublish = async () => {
    await handleSave({ status: 'published' } as Partial<Job>);
  };

  const onUnpublish = async () => {
    await handleSave({ status: 'draft' } as Partial<Job>);
  };

  const onFeatureToggle = async (roleId: string, featured: boolean) => {
    await handleSave({ is_featured: featured } as Partial<Job>);
  };
  
  if (isLoading) {
    return <div>Loading Role...</div>; // Replace with a proper skeleton loader
  }

  if (roleError) {
    return <div>Error: {roleError}</div>;
  }

  if (!isNew && !role) {
    return <div>Role not found.</div>;
  }

  // Get company name for header
  const companyName = role?.company?.name || companies.find(c => c.id === role?.company_id)?.name
  const customTitle = !isNew && role?.title 
    ? `Edit: ${role.title}${companyName ? ` (${companyName})` : ''}`
    : undefined

  return (
    <EntityDetailView
      entity={role || defaultRole}
      entityType="role"
      tabs={tabs as any}
      onSave={onSave}
      onDelete={!isNew ? onDelete : undefined}
      onPublish={!isNew ? onPublish : undefined}
      onUnpublish={!isNew && role?.status === 'published' ? onUnpublish : undefined}
      onFeatureToggle={!isNew && isSuperAdmin ? onFeatureToggle : undefined}
      isNew={isNew}
      backHref="/admin/roles"
      customTitle={customTitle}
      alertMessage="You're editing live data. Changes will be reflected immediately after saving."
      viewHref={!isNew ? `/jobs/${role?.id}` : undefined}
    />
  )
}
