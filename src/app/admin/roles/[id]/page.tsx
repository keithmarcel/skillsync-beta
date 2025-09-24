'use client';

import { useRouter } from 'next/navigation';
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useAdminEntity } from '@/hooks/useAdminEntity';
import { useCompaniesList } from '@/hooks/useCompaniesList';
import { useSkillsList } from '@/hooks/useSkillsList';
import { useAuth } from '@/hooks/useAuth';
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
          key: 'category',
          label: 'Category',
          type: EntityFieldType.SELECT,
          required: true,
          options: [
            { value: '', label: 'Select a category' },
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
      viewHref={!isNew ? `/jobs/${role?.id}` : undefined}
    />
  )
}
