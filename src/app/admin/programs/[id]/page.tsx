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

  const defaultProgram: Partial<Program> = {
    id: '',
    name: '',
    program_id: '',
    school_id: null,
    program_type: null,
    format: null,
    duration_text: null,
    short_desc: null,
    long_desc: null,
    discipline: null,
    catalog_provider: 'Direct',
    program_url: null,
    program_guide_url: null,
    cip_code: null,
    is_featured: false,
    featured_image_url: null,
    skills_count: 0,
    status: 'draft',
  };

  // Define the form tabs and fields (5 tabs for optimal UX)
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
          key: 'discipline',
          label: 'Discipline',
          type: EntityFieldType.SELECT,
          required: true,
          options: [
            { value: '', label: 'Select a discipline' },
            { value: 'Business', label: 'Business' },
            { value: 'Technology', label: 'Technology' },
            { value: 'Healthcare', label: 'Healthcare' },
            { value: 'Engineering', label: 'Engineering' },
            { value: 'Education', label: 'Education' },
            { value: 'Arts & Humanities', label: 'Arts & Humanities' },
            { value: 'Science', label: 'Science' },
            { value: 'Social Sciences', label: 'Social Sciences' },
            { value: 'Criminal Justice', label: 'Criminal Justice' },
            { value: 'Human Resources', label: 'Human Resources' },
            { value: 'General Studies', label: 'General Studies' }
          ]
        },
        {
          key: 'catalog_provider',
          label: 'Catalog Provider',
          type: EntityFieldType.SELECT,
          required: true,
          options: [
            { value: 'Direct', label: 'Direct' },
            { value: 'Bisk Amplified', label: 'Bisk Amplified' }
          ]
        },
        {
          key: 'program_type',
          label: 'Credential Type',
          type: EntityFieldType.SELECT,
          options: [
            { value: '', label: 'Select type' },
            { value: 'Certificate', label: 'Certificate' },
            { value: 'Diploma', label: 'Diploma' },
            { value: "Associate's Degree", label: "Associate's Degree" },
            { value: "Bachelor's Degree", label: "Bachelor's Degree" },
            { value: "Master's Degree", label: "Master's Degree" },
            { value: 'Doctoral Degree', label: 'Doctoral Degree' },
            { value: 'Professional Certification', label: 'Professional Certification' }
          ]
        },
        {
          key: 'format',
          label: 'Format',
          type: EntityFieldType.SELECT,
          options: [
            { value: '', label: 'Select format' },
            { value: 'Online', label: 'Online' },
            { value: 'In-Person', label: 'In-Person' },
            { value: 'Hybrid', label: 'Hybrid' },
            { value: 'Self-Paced', label: 'Self-Paced' }
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
        },
        {
          key: 'is_featured',
          label: 'Featured Program',
          type: EntityFieldType.SWITCH,
          helpText: 'Featured programs appear in the Featured Programs tab'
        }
      ]
    },
    {
      id: 'content',
      label: 'Program Content',
      fields: [
        {
          key: 'short_desc',
          label: 'Short Description',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'Brief program summary (80-100 characters)...',
          helpText: 'Concise description for program cards and listings'
        },
        {
          key: 'long_desc',
          label: 'Full Description',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'Detailed program overview...',
          helpText: 'Complete program description for detail pages'
        },
        {
          key: 'program_url',
          label: 'Program Page URL',
          type: EntityFieldType.TEXT,
          placeholder: 'https://app.biskamplified.com/amp-programs-overview/...'
        },
        {
          key: 'program_guide_url',
          label: 'Program Guide URL',
          type: EntityFieldType.TEXT,
          placeholder: 'https://example.com/program-guide.pdf'
        }
      ]
    },
    {
      id: 'media',
      label: 'Media',
      fields: [
        {
          key: 'featured_image_url',
          label: 'Featured Image URL',
          type: EntityFieldType.TEXT,
          placeholder: '/assets/programs/program-hero.jpg',
          helpText: 'Hero image for program detail pages (required if featured)'
        }
      ]
    },
    {
      id: 'skills',
      label: 'Skills',
      fields: [
        {
          key: 'skills_count',
          label: 'Skills Count',
          type: EntityFieldType.TEXT,
          readOnly: true,
          helpText: 'Auto-updated when skills are linked to this program'
        }
      ]
    },
    {
      id: 'metadata',
      label: 'Metadata',
      fields: [
        {
          key: 'program_id',
          label: 'Program ID',
          type: EntityFieldType.TEXT,
          readOnly: true,
          helpText: 'Unique identifier (HubSpot Record ID or generated)'
        },
        {
          key: 'created_at',
          label: 'Created At',
          type: EntityFieldType.TEXT,
          readOnly: true
        },
        {
          key: 'updated_at',
          label: 'Last Updated',
          type: EntityFieldType.TEXT,
          readOnly: true
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
      entity={(program || defaultProgram) as any}
      entityType="program"
      tabs={tabs as any}
      onSave={onSave as any}
      onDelete={!isNew ? onDelete : undefined}
      isNew={isNew}
      backHref="/admin/programs"
      viewHref={!isNew ? `/programs/${program?.id}` : undefined}
    />
  )
}
