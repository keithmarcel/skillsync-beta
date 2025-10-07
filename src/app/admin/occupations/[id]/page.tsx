'use client';

import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView';
import { useAdminEntity } from '@/hooks/useAdminEntity';
import type { Job } from '@/lib/database/queries';

export default function OccupationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { 
    entity: occupation, 
    isLoading, 
    error, 
    handleSave, 
    handleDelete 
  } = useAdminEntity<Job>('jobs', params.id === 'new' ? null : params.id);

  const isNew = params.id === 'new';

  const defaultOccupation: Job = {
    id: '',
    title: '',
    soc_code: '',
    job_kind: 'occupation',
    status: 'published',
    company_id: null,
    job_type: null,
    category: null,
    location_city: null,
    location_state: null,
    median_wage_usd: null,
    long_desc: null,
    featured_image_url: null,
    skills_count: 0,
    is_featured: false,
    employment_outlook: null,
    education_level: null,
    work_experience: null,
    on_job_training: null,
    job_openings_annual: null,
    growth_rate_percent: null,
    required_proficiency_pct: null,
    created_at: '',
    updated_at: '',
  };

  const onSave = async (updatedData: Partial<Job>) => {
    const savedOccupation = await handleSave({ ...updatedData, job_kind: 'occupation' });
    if (savedOccupation && isNew) {
      router.push(`/admin/occupations/${savedOccupation.id}`);
    }
  };

  const onDelete = async () => {
    const success = await handleDelete();
    if (success) {
      router.push('/admin/occupations');
    }
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      fields: [
        { key: 'title', label: 'Occupation Title', type: EntityFieldType.TEXT, required: true },
        { key: 'soc_code', label: 'SOC Code', type: EntityFieldType.TEXT, required: true },
        { key: 'long_desc', label: 'Description', type: EntityFieldType.TEXTAREA },
        { key: 'category', label: 'Category', type: EntityFieldType.TEXT },
        { key: 'job_type', label: 'Job Type', type: EntityFieldType.TEXT },
        { key: 'location_city', label: 'City', type: EntityFieldType.TEXT },
        { key: 'location_state', label: 'State', type: EntityFieldType.TEXT },
      ],
    },
    {
      id: 'labor_market',
      label: 'Labor Market',
      fields: [
        { key: 'median_wage_usd', label: 'Median Salary (USD)', type: EntityFieldType.NUMBER },
        { key: 'employment_outlook', label: 'Employment Outlook', type: EntityFieldType.TEXT },
        { key: 'education_level', label: 'Education Level', type: EntityFieldType.TEXT },
        { key: 'work_experience', label: 'Work Experience', type: EntityFieldType.TEXT },
        { key: 'on_job_training', label: 'On-the-Job Training', type: EntityFieldType.TEXT },
        { key: 'job_openings_annual', label: 'Annual Job Openings', type: EntityFieldType.NUMBER },
        { key: 'growth_rate_percent', label: 'Growth Rate (%)', type: EntityFieldType.NUMBER },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader text="Loading Occupation..." />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <EntityDetailView
      entity={occupation || defaultOccupation}
      entityType="occupation"
      tabs={tabs as any}
      onSave={onSave as any}
      onDelete={!isNew ? onDelete : undefined}
      isNew={isNew}
      backHref="/admin/occupations"
    />
  );
}


