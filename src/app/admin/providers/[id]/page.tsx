'use client';

import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView';
import { useAdminEntity } from '@/hooks/useAdminEntity';
import type { School } from '@/lib/database/queries';

export default function ProviderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { 
    entity: provider, 
    isLoading, 
    error, 
    handleSave, 
    handleDelete 
  } = useAdminEntity<School>('schools', params.id === 'new' ? null : params.id);

  const isNew = params.id === 'new';

  const defaultProvider: School = {
    id: '',
    name: '',
    logo_url: '',
    about_url: '',
    city: '',
    state: '',
  };

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
  
  const onSave = async (updatedData: Partial<School>) => {
    const savedProvider = await handleSave(updatedData);
    if (savedProvider && isNew) {
      router.push(`/admin/providers/${savedProvider.id}`);
    }
  };

  const onDelete = async () => {
    const success = await handleDelete();
    if (success) {
      router.push('/admin/providers');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader text="Loading Provider..." />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!isNew && !provider) {
    return <div>Provider not found.</div>;
  }

  return (
    <EntityDetailView
      entity={provider || defaultProvider}
      entityType="provider"
      tabs={tabs as any}
      onSave={onSave}
      onDelete={!isNew ? onDelete : undefined}
      isNew={isNew}
      backHref="/admin/providers"
      viewHref={!isNew ? `/providers/${provider?.id}` : undefined}
    />
  )
}
