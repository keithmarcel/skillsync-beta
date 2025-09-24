'use client';

import { useRouter } from 'next/navigation';
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView';
import { useAdminEntity } from '@/hooks/useAdminEntity';
import { useSchoolsList } from '@/hooks/useSchoolsList';
import { useCipCodesList } from '@/hooks/useCipCodesList';
import type { Program } from '@/lib/database/queries';

export default function ProgramDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { 
    entity: program, 
    isLoading: isLoadingProgram, 
    error: programError, 
    handleSave, 
    handleDelete 
  } = useAdminEntity<Program>('programs', params.id === 'new' ? null : params.id);

  const { schools, isLoading: isLoadingSchools } = useSchoolsList();
  const { cipCodes, isLoading: isLoadingCipCodes } = useCipCodesList();

  const isNew = params.id === 'new';
  const isLoading = isLoadingProgram || isLoadingSchools || isLoadingCipCodes;

  const defaultProgram: Program = {
    id: '',
    name: '',
    school_id: null,
    program_type: null,
    format: null,
    duration_text: null,
    short_desc: null,
    program_url: null,
    cip_code: null,
    status: 'draft',
  };

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
  
  const onSave = async (updatedData: Partial<Program>) => {
    const savedProgram = await handleSave(updatedData);
    if (savedProgram && isNew) {
      router.push(`/admin/programs/${savedProgram.id}`);
    }
  };

  const onDelete = async () => {
    const success = await handleDelete();
    if (success) {
      router.push('/admin/programs');
    }
  };
  
  if (isLoading) {
    return <div>Loading Program...</div>;
  }

  if (programError) {
    return <div>Error: {programError}</div>;
  }

  if (!isNew && !program) {
    return <div>Program not found.</div>;
  }

  return (
    <EntityDetailView
      entity={program || defaultProgram}
      entityType="program"
      tabs={tabs as any}
      onSave={onSave}
      onDelete={!isNew ? onDelete : undefined}
      isNew={isNew}
      backHref="/admin/programs"
      viewHref={!isNew ? `/programs/${program?.id}` : undefined}
    />
  )
}
