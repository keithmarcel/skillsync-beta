'use client';

import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView';
import { useAdminEntity } from '@/hooks/useAdminEntity';
import type { Company } from '@/lib/database/queries';

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { 
    entity: company, 
    isLoading, 
    error, 
    handleSave, 
    handleDelete 
  } = useAdminEntity<Company>('companies', params.id === 'new' ? null : params.id);
  const isNew = params.id === 'new';

  const defaultCompany: Company = {
    id: '',
    name: '',
    industry: '',
    hq_city: '',
    hq_state: '',
    employee_range: '',
    revenue_range: '',
    bio: '',
    logo_url: '',
    company_image_url: '',
    is_trusted_partner: false,
    is_published: true,
  };

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
          key: 'is_published',
          label: 'Published Status',
          type: EntityFieldType.SWITCH,
          description: 'Control whether this company and its jobs are visible in the main app'
        }
      ]
    }
  ]
  
  const onSave = async (updatedData: Partial<Company>) => {
    const savedCompany = await handleSave(updatedData);
    if (savedCompany && isNew) {
      router.push(`/admin/companies/${savedCompany.id}`);
    }
  };

  const onDelete = async () => {
    const success = await handleDelete();
    if (success) {
      router.push('/admin/companies');
    }
  };

  const onFeatureToggle = async (companyId: string, featured: boolean) => {
    await handleSave({ is_published: featured } as Partial<Company>);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader text="Loading Company..." />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!isNew && !company) {
    return <div>Company not found.</div>;
  }

  return (
    <EntityDetailView
      entity={company || defaultCompany}
      entityType="company"
      tabs={tabs as any}
      onSave={onSave}
      onDelete={!isNew ? onDelete : undefined}
      onFeatureToggle={!isNew ? onFeatureToggle : undefined}
      isNew={isNew}
      backHref="/admin/companies"
      viewHref={!isNew ? `/companies/${company?.id}` : undefined}
    />
  )
}
