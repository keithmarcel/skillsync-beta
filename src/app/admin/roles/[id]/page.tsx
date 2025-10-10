'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAdminEntity } from '@/hooks/useAdminEntity';
import { useCompaniesList } from '@/hooks/useCompaniesList';
import { useSkillsList } from '@/hooks/useSkillsList';
import { useAuth } from '@/hooks/useAuth';
import { SocAutoSuggest } from '@/components/admin/soc-auto-suggest';
import { AIGenerateButton } from '@/components/admin/ai-generate-button';
import { SOCSkillsExtractor } from '@/components/admin/soc-skills-extractor';
import { ManualSkillsSelector } from '@/components/admin/manual-skills-selector';
import { DraggableCardEditor } from '@/components/admin/draggable-card-editor';
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
  
  const [localChanges, setLocalChanges] = React.useState<Record<string, any>>({});
  
  // Track if there are unsaved card editor changes
  const hasLocalChanges = Object.keys(localChanges).length > 0;
  
  // Clear local changes when role data updates (after save)
  React.useEffect(() => {
    if (role && !isLoadingRole) {
      // Clear local changes when fresh data arrives from DB
      setLocalChanges({});
    }
  }, [role?.updated_at, isLoadingRole]); // Only when updated_at changes (after save)
  
  // Debug: Log the role data to see what's being loaded
  React.useEffect(() => {
    if (role) {
      console.log('🔍 Role data loaded:', {
        id: role.id,
        title: role.title,
        job_type: role.job_type,
        median_wage_usd: role.median_wage_usd,
        work_location_type: role.work_location_type,
        location_city: role.location_city,
        location_state: role.location_state,
        education_level: role.education_level,
      });
    }
  }, [role]);
  
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
          placeholder: 'e.g., Senior Software Engineer',
          description: 'Shown on: Role Card, Role Details Page (header)'
        },
        {
          key: 'soc_code',
          label: 'SOC Code',
          type: EntityFieldType.CUSTOM,
          required: true,
          description: 'Shown on: Backend only (determines skills and O*NET data matching)',
          component: ({ value, onChange, entity }: any) => {
            const handleAccept = (socCode: string) => {
              onChange(socCode)
            }
            
            return (
              <div className="space-y-3">
                <Input
                  value={value || ''}
                  onChange={(e: any) => onChange(e.target.value)}
                  placeholder="e.g., 13-1082.00"
                />
                <SocAutoSuggest
                  jobTitle={entity.title || ''}
                  jobDescription={entity.long_desc || ''}
                  onAccept={handleAccept}
                  disabled={!entity.title}
                />
              </div>
            )
          }
        },
        {
          key: 'company_id',
          label: 'Company',
          type: EntityFieldType.SELECT,
          required: true,
          disabled: isCompanyAdmin, // Company admins can't change company
          placeholder: 'Select a company',
          description: 'Shown on: Role Card, Role Details Page (header)',
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
          description: 'Shown on: Backend only (determines listing category)',
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
          description: 'Shown on: Role Card (badge), Role Details Page',
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
          key: 'job_type',
          label: 'Employment Type',
          type: EntityFieldType.SELECT,
          required: true,
          placeholder: 'Select employment type',
          description: 'Shown on: Role Card (pill), Role Details Page',
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
          required: true,
          placeholder: 'Select work arrangement',
          description: 'Shown on: Role Details Page only',
          options: [
            { value: 'Onsite', label: 'Onsite' },
            { value: 'Remote', label: 'Remote' },
            { value: 'Hybrid', label: 'Hybrid' }
          ]
        },
        {
          key: 'location_city',
          label: 'City',
          type: EntityFieldType.TEXT,
          required: true,
          placeholder: 'e.g., Tampa',
          description: 'Shown on: Role Details Page only'
        },
        {
          key: 'location_state',
          label: 'State',
          type: EntityFieldType.TEXT,
          required: true,
          placeholder: 'e.g., FL',
          description: 'Shown on: Role Details Page only'
        },
        {
          key: 'education_level',
          label: 'Education Requirements',
          type: EntityFieldType.SELECT,
          required: true,
          description: 'Shown on: Role Details Page only',
          helpText: (
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Inherits from O*NET/BLS data if available, can be overridden
            </span>
          ),
          placeholder: 'Select education level',
          options: [
            { value: 'No formal educational credential', label: 'No formal education' },
            { value: 'High school diploma or equivalent', label: 'High school diploma or equivalent' },
            { value: 'Postsecondary nondegree award', label: 'Certificate' },
            { value: "Associate's degree", label: "Associate's Degree" },
            { value: "Bachelor's degree", label: "Bachelor's Degree" },
            { value: "Master's degree", label: "Master's Degree" },
            { value: 'Doctoral or professional degree', label: 'Doctorate' }
          ]
        },
        {
          key: 'median_wage_usd',
          label: 'Median Salary',
          type: EntityFieldType.CURRENCY,
          required: true,
          placeholder: 'e.g., 75000',
          description: 'Shown on: Role Card, Role Details Page',
          helpText: (
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Inherits from BLS wage data (Tampa MSA) if available, can be overridden
            </span>
          ),
          format: (value: number | null) => value ? formatCurrency(value) : '',
          parse: (value: string) => value ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : null
        },
        {
          key: 'featured_image_url',
          label: 'Featured Image',
          type: EntityFieldType.CUSTOM,
          required: true,
          description: 'Shown on: Role Details Page only (hero image, 800×600px)',
          helpText: 'Recommended upload size: 1600×1200px (2x for retina)',
          component: ({ value, onChange, entity }: any) => {
            const [uploading, setUploading] = React.useState(false)
            const fileInputRef = React.useRef<HTMLInputElement>(null)
            
            const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0]
              if (!file || !entity.id) return

              // Validate file type
              const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
              if (!allowedTypes.includes(file.type)) {
                alert('Invalid file type. Only JPG, PNG, and WebP files are allowed.')
                return
              }

              // Validate file size (5MB)
              if (file.size > 5 * 1024 * 1024) {
                alert('File too large. Maximum file size is 5MB.')
                return
              }

              // Validate image dimensions
              const img = new Image()
              const previewUrl = URL.createObjectURL(file)
              
              img.onload = async () => {
                // Check minimum dimensions (800x600)
                if (img.width < 800 || img.height < 600) {
                  alert(`Image too small. Minimum size is 800×600 pixels. Your image is ${img.width}×${img.height}.`)
                  URL.revokeObjectURL(previewUrl)
                  return
                }

                // Upload the file
                setUploading(true)
                try {
                  const formData = new FormData()
                  formData.append('image', file)
                  formData.append('roleId', entity.id)

                  const response = await fetch('/api/admin/role-image', {
                    method: 'POST',
                    body: formData
                  })

                  if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'Failed to upload image')
                  }

                  const result = await response.json()
                  onChange(result.image_url)
                  alert('Image uploaded successfully!')
                } catch (error) {
                  alert(error instanceof Error ? error.message : 'Failed to upload image')
                } finally {
                  setUploading(false)
                  URL.revokeObjectURL(previewUrl)
                }
              }
              
              img.onerror = () => {
                alert('Invalid image. Could not load the selected file.')
                URL.revokeObjectURL(previewUrl)
              }
              
              img.src = previewUrl
            }

            return (
              <div className="space-y-3">
                {value && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Preview (actual size on detail page):</div>
                    <div className="relative w-full max-w-[800px] h-[600px] rounded-lg overflow-hidden border-2 border-gray-300">
                      <img 
                        src={value} 
                        alt="Featured" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => onChange(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !entity.id}
                  >
                    {uploading ? 'Uploading...' : 'Choose File'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    📐 <strong>Recommended size:</strong> 1600×1200px (2x for retina displays)<br/>
                    📁 <strong>Accepted formats:</strong> JPG, PNG, WebP (max 5MB)<br/>
                    📏 <strong>Minimum size:</strong> 800×600px
                  </p>
                </div>
              </div>
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
          label: 'Short Description',
          type: EntityFieldType.CUSTOM,
          required: true,
          description: 'Shown on: Role Card only (13-15 words, ~95 characters)',
          component: ({ value, onChange }: any) => (
            <div className="space-y-2">
              <textarea
                value={value || ''}
                onChange={(e: any) => onChange(e.target.value)}
                placeholder="Enter a brief description..."
                className="w-full min-h-[80px] p-3 border rounded-md resize-none"
                maxLength={95}
              />
              <span className="text-xs text-gray-500">
                {value?.length || 0}/95 characters
              </span>
            </div>
          )
        },
        {
          key: 'long_desc',
          label: 'Full Job Description',
          type: EntityFieldType.CUSTOM,
          required: true,
          description: 'Shown on: Role Details Page only',
          component: ({ value, onChange }: any) => (
            <div className="space-y-2">
              <textarea
                value={value || ''}
                onChange={(e: any) => onChange(e.target.value)}
                placeholder="Enter a detailed job description..."
                className="w-full min-h-[200px] p-3 border rounded-md resize-none"
              />
            </div>
          )
        }
      ]
    },
    {
      id: 'skills',
      label: 'Skills',
      fields: [
        {
          key: 'current_skills',
          label: 'Currently Assigned Skills',
          type: EntityFieldType.CUSTOM,
          render: () => {
            const [jobSkills, setJobSkills] = React.useState<any[]>([]);
            const [loading, setLoading] = React.useState(true);

            React.useEffect(() => {
              if (role?.id) {
                fetch(`/api/admin/roles/${role.id}/skills`)
                  .then(res => res.json())
                  .then(data => {
                    setJobSkills(data.skills || []);
                    setLoading(false);
                  })
                  .catch(() => setLoading(false));
              }
            }, [role?.id]);

            return (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Current Skills</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Skills inherited from SOC taxonomy mapping. Use the extractor below to update.
                  </p>
                </div>
                
                {loading ? (
                  <div className="text-sm text-gray-500">Loading skills...</div>
                ) : jobSkills.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">
                    No skills assigned yet. Use the extractor below to add skills.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {jobSkills.map((js: any) => (
                      <div
                        key={js.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 border border-teal-600 rounded-full text-sm"
                      >
                        <span className="font-medium text-teal-600">{js.name}</span>
                        {js.weight && (
                          <span className="text-xs text-teal-600 opacity-75">
                            {Math.round(js.weight * 100)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
        },
        {
          key: 'skills_extractor',
          label: 'AI Skills Extraction',
          type: EntityFieldType.CUSTOM,
          render: (value: any, formData: any) => {
            const [refreshKey, setRefreshKey] = React.useState(0);
            
            return (
              <SOCSkillsExtractor
                socCode={(formData as any).soc_code || ''}
                onSkillsUpdated={() => {
                  // Refresh the skills display above
                  setRefreshKey(prev => prev + 1);
                  // Trigger a re-fetch of the current skills
                  if (role?.id) {
                    window.location.reload(); // Simple refresh for now
                  }
                }}
              />
            );
          }
        },
        {
          key: 'manual_skills_selector',
          label: 'Manual Skills Selection',
          type: EntityFieldType.CUSTOM,
          render: (value: any, formData: any) => {
            const [refreshKey, setRefreshKey] = React.useState(0);
            
            return (
              <ManualSkillsSelector
                socCode={(formData as any).soc_code || ''}
                onSkillsUpdated={() => {
                  // Refresh the skills display above
                  setRefreshKey(prev => prev + 1);
                  // Trigger a re-fetch of the current skills
                  if (role?.id) {
                    window.location.reload(); // Simple refresh for now
                  }
                }}
              />
            );
          }
        }
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
      label: 'Role Details',
      fields: [
        {
          key: 'onet_alert',
          label: '',
          type: EntityFieldType.CUSTOM,
          render: () => (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-6 -mt-2">
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Inherits from O*NET occupational data based on SOC code, can be overridden</span>
            </div>
          )
        },
        {
          key: 'core_responsibilities',
          label: 'Core Responsibilities',
          type: EntityFieldType.CUSTOM,
          render: () => {
            // Use local changes if available, otherwise use role data
            const value = localChanges.core_responsibilities ?? role?.core_responsibilities;
            let responsibilities: string[] = [];
            if (typeof value === 'string') {
              try {
                responsibilities = JSON.parse(value);
              } catch {
                responsibilities = value ? [value] : [];
              }
            } else if (Array.isArray(value)) {
              responsibilities = value;
            }

            const handleChange = (items: string[]) => {
              console.log('🔄 Core Responsibilities changed:', items);
              setLocalChanges(prev => {
                const updated = {
                  ...prev,
                  core_responsibilities: JSON.stringify(items)
                };
                console.log('📝 Local changes updated:', updated);
                return updated;
              });
            };

            return (
              <DraggableCardEditor
                items={responsibilities}
                onChange={handleChange}
                title="Core Responsibilities"
                description="These appear as cards on the role detail page. Drag to reorder, click edit to modify text."
                maxItems={12}
              />
            );
          }
        },
        {
          key: 'tasks',
          label: 'Day-to-Day Tasks',
          type: EntityFieldType.CUSTOM,
          render: () => {
            // Use local changes if available, otherwise use role data
            const value = localChanges.tasks ?? role?.tasks;
            let tasks: string[] = [];
            if (Array.isArray(value)) {
              tasks = value.map((task: any) => {
                if (typeof task === 'string') return task;
                return task.task || task.TaskDescription || '';
              }).filter(Boolean);
            }

            const handleChange = (items: string[]) => {
              setLocalChanges(prev => ({
                ...prev,
                tasks: items.map(task => ({ task }))
              }));
            };

            return (
              <DraggableCardEditor
                items={tasks}
                onChange={handleChange}
                title="Day-to-Day Tasks"
                description="Typical tasks for this role. These appear as cards on the detail page. Drag to reorder."
                maxItems={12}
              />
            );
          }
        },
        {
          key: 'tools_and_technology',
          label: 'Tools & Technology',
          type: EntityFieldType.CUSTOM,
          render: () => {
            // Use local changes if available, otherwise use role data
            const value = localChanges.tools_and_technology ?? role?.tools_and_technology;
            let tools: string[] = [];
            if (Array.isArray(value)) {
              tools = value.map((tool: any) => {
                if (typeof tool === 'string') return tool;
                return tool.name || tool.ToolName || tool.TechnologyName || '';
              }).filter(Boolean);
            }

            const handleChange = (items: string[]) => {
              setLocalChanges(prev => ({
                ...prev,
                tools_and_technology: items.map(tool => ({ name: tool }))
              }));
            };

            return (
              <DraggableCardEditor
                items={tools}
                onChange={handleChange}
                title="Commonly Used Tools & Technology"
                description="Tools, software, and technology used in this role. These appear as cards on the detail page."
                maxItems={15}
              />
            );
          }
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
    },
    {
      id: 'additional',
      label: 'Additional Role Details',
      fields: [
        {
          key: 'experience_level',
          label: 'Experience Level',
          type: EntityFieldType.SELECT,
          description: 'Shown on: Not currently displayed',
          helpText: 'Internal field for future use',
          options: [
            { value: 'entry', label: 'Entry Level' },
            { value: 'mid_level', label: 'Mid Level' },
            { value: 'senior', label: 'Senior' },
            { value: 'lead', label: 'Lead' },
            { value: 'executive', label: 'Executive' }
          ]
        }
      ]
    }
  ]
  
  const onSave = async (updatedData: Partial<Job>) => {
    console.log('💾 Save triggered');
    console.log('📦 Form data:', updatedData);
    console.log('🎨 Local changes:', localChanges);
    
    // Merge local changes (from card editors) with form data
    const dataToSave = {
      ...updatedData,
      ...localChanges
    };
    
    console.log('🚀 Final data to save:', dataToSave);
    
    // If user manually changed median_wage_usd, mark it as overridden
    if (dataToSave.median_wage_usd !== undefined && dataToSave.median_wage_usd !== role?.median_wage_usd) {
      (dataToSave as any).median_wage_manual_override = true;
    }
    
    const savedRole = await handleSave(dataToSave);
    
    console.log('✅ Save result:', savedRole);
    
    // Don't clear local changes - they'll be overwritten when role data refreshes
    // The useAdminEntity hook should update the role with fresh data from DB
    // Clearing localChanges here causes the UI to revert before role updates
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
      hasExternalChanges={hasLocalChanges}
    />
  )
}
