'use client';

import { useRouter } from 'next/navigation';
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView';
import { useAdminEntity } from '@/hooks/useAdminEntity';
import { useCompaniesList } from '@/hooks/useCompaniesList';
import { useSchoolsList } from '@/hooks/useSchoolsList';
import { supabase } from '@/lib/supabase/client';

interface Profile {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  zip_code?: string;
  admin_role?: 'super_admin' | 'company_admin' | 'provider_admin' | null;
  company_id?: string | null;
  school_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface ExtendedProfile extends Profile {
  company?: { id: string; name: string };
  school?: { id: string; name: string };
  agreed_to_terms?: boolean;
  phone?: string;
  job_title?: string;
  company_name?: string;
  linkedin_url?: string;
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { entity: user, isLoading, error, handleSave, handleDelete } = useAdminEntity<ExtendedProfile>('profiles', params.id === 'new' ? null : params.id);
  const { companies } = useCompaniesList();
  const { schools } = useSchoolsList();

  const isNew = params.id === 'new';

  const defaultUser: ExtendedProfile = {
    id: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'basic_user',
    admin_role: null,
    zip_code: '',
    agreed_to_terms: false,
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
          key: 'first_name',
          label: 'First Name',
          type: EntityFieldType.TEXT,
          required: true,
          placeholder: 'Enter first name'
        },
        {
          key: 'last_name',
          label: 'Last Name',
          type: EntityFieldType.TEXT,
          required: true,
          placeholder: 'Enter last name'
        },
        {
          key: 'email',
          label: 'Email',
          type: EntityFieldType.TEXT,
          required: true,
          placeholder: 'Enter email address',
          disabled: !isNew // Can't change email after creation
        },
        {
          key: 'zip_code',
          label: 'ZIP Code',
          type: EntityFieldType.TEXT,
          placeholder: 'Enter ZIP code'
        },
        {
          key: 'role',
          label: 'User Role',
          type: EntityFieldType.SELECT,
          required: true,
          options: [
            { value: 'basic_user', label: 'Basic User' },
            { value: 'org_user', label: 'Organization User' },
            { value: 'partner_admin', label: 'Partner Admin' }
          ]
        }
      ]
    },
    {
      id: 'admin',
      label: 'Admin Settings',
      fields: [
        {
          key: 'admin_role',
          label: 'Admin Role',
          type: EntityFieldType.SELECT,
          options: [
            { value: '', label: 'No Admin Role' },
            { value: 'super_admin', label: 'Super Admin' },
            { value: 'company_admin', label: 'Company Admin' },
            { value: 'provider_admin', label: 'Provider Admin' }
          ]
        },
        {
          key: 'company_id',
          label: 'Company Association',
          type: EntityFieldType.SELECT,
          options: [
            { value: '', label: 'No Company' },
            ...companies.map(company => ({
              value: company.id,
              label: company.name
            }))
          ],
          description: 'Associate this user with a company (for company admins and org users)'
        },
        {
          key: 'school_id',
          label: 'School Association',
          type: EntityFieldType.SELECT,
          options: [
            { value: '', label: 'No School' },
            ...schools.map(school => ({
              value: school.id,
              label: school.name
            }))
          ],
          description: 'Associate this user with a school (for provider admins)'
        }
      ]
    },
    {
      id: 'settings',
      label: 'Account Settings',
      fields: [
        {
          key: 'agreed_to_terms',
          label: 'Agreed to Terms',
          type: EntityFieldType.SWITCH,
          description: 'User has agreed to terms and conditions'
        },
        {
          key: 'phone',
          label: 'Phone Number',
          type: EntityFieldType.TEXT,
          placeholder: 'Enter phone number'
        },
        {
          key: 'job_title',
          label: 'Job Title',
          type: EntityFieldType.TEXT,
          placeholder: 'Enter job title'
        },
        {
          key: 'company_name',
          label: 'Company Name',
          type: EntityFieldType.TEXT,
          placeholder: 'Enter company name (if different from associated company)'
        },
        {
          key: 'linkedin_url',
          label: 'LinkedIn URL',
          type: EntityFieldType.TEXT,
          placeholder: 'https://linkedin.com/in/username'
        }
      ]
    }
  ];

  const onSave = async (updatedData: Partial<ExtendedProfile>) => {
    try {
      // Handle company/school associations
      if (updatedData.company_id === '') {
        updatedData.company_id = null;
      }
      if (updatedData.school_id === '') {
        updatedData.school_id = null;
      }

      // Handle admin role
      if ((updatedData.admin_role as any) === '') {
        updatedData.admin_role = null;
      }

      const savedUser = await handleSave(updatedData);

      if (savedUser && isNew) {
        router.push(`/admin/users/${savedUser.id}`);
      }
    } catch (err) {
      console.error('Error saving user:', err);
      throw err;
    }
  };

  const onDelete = async () => {
    const success = await handleDelete();
    if (success) {
      router.push('/admin/users');
    }
  };

  if (isLoading) {
    return <div>Loading user...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!isNew && !user) {
    return <div>User not found.</div>;
  }

  return (
    <EntityDetailView
      entity={user || defaultUser}
      entityType="user"
      tabs={tabs as any}
      onSave={onSave}
      onDelete={!isNew ? onDelete : undefined}
      isNew={isNew}
      backHref="/admin/users"
    />
  );
}
