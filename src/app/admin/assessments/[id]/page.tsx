'use client';

import { useRouter } from 'next/navigation';
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView';
import { useAdminEntity } from '@/hooks/useAdminEntity';
import { useJobsList } from '@/hooks/useJobsList';
import type { Assessment } from '@/lib/database/queries';

export default function AssessmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { 
    entity: assessment, 
    isLoading: isLoadingAssessment, 
    error: assessmentError, 
    handleSave, 
    handleDelete 
  } = useAdminEntity<Assessment>('assessments', params.id === 'new' ? null : params.id);

  const { jobs, isLoading: isLoadingJobs } = useJobsList();

  const isNew = params.id === 'new';
  const isLoading = isLoadingAssessment || isLoadingJobs;

  const defaultAssessment: Assessment = {
    id: '',
    job_id: null,
    user_id: null,
    method: 'quiz',
    status_tag: 'needs_development',
    readiness_pct: null,
    analyzed_at: null,
    is_active: false,
  };

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
  
  const onSave = async (updatedData: Partial<Assessment>) => {
    const savedAssessment = await handleSave(updatedData);
    if (savedAssessment && isNew) {
      router.push(`/admin/assessments/${savedAssessment.id}`);
    }
  };

  const onDelete = async () => {
    const success = await handleDelete();
    if (success) {
      router.push('/admin/assessments');
    }
  };

  const onFeatureToggle = async (id: string, active: boolean) => {
    await handleSave({ is_active: active } as Partial<Assessment>);
  };
  
  if (isLoading) {
    return <div>Loading Assessment...</div>;
  }

  if (assessmentError) {
    return <div>Error: {assessmentError}</div>;
  }

  if (!isNew && !assessment) {
    return <div>Assessment not found.</div>;
  }

  return (
    <EntityDetailView
      entity={assessment || defaultAssessment}
      entityType="assessment"
      tabs={tabs as any}
      onSave={onSave}
      onDelete={!isNew ? onDelete : undefined}
      onFeatureToggle={!isNew ? onFeatureToggle : undefined}
      isNew={isNew}
      backHref="/admin/assessments"
      viewHref={!isNew ? `/assessments/${assessment?.id}` : undefined}
    />
  )
}
