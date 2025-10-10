'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { EntityDetailView, EntityFieldType } from '@/components/admin/EntityDetailView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
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
                toast({
                  title: 'Invalid File Type',
                  description: 'Only JPG, PNG, and WebP files are allowed.',
                  variant: 'destructive'
                })
                return
              }

              // Validate file size (5MB)
              if (file.size > 5 * 1024 * 1024) {
                toast({
                  title: 'File Too Large',
                  description: 'Maximum file size is 5MB.',
                  variant: 'destructive'
                })
                return
              }

              // Validate image dimensions
              const img = new Image()
              const previewUrl = URL.createObjectURL(file)
              
              img.onload = async () => {
                // Check minimum dimensions (800x600)
                if (img.width < 800 || img.height < 600) {
                  toast({
                    title: 'Image Too Small',
                    description: `Minimum size is 800×600 pixels. Your image is ${img.width}×${img.height}.`,
                    variant: 'destructive'
                  })
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
                  toast({
                    title: 'Image Uploaded',
                    description: 'Image uploaded successfully!'
                  })
                } catch (error) {
                  toast({
                    title: 'Upload Failed',
                    description: error instanceof Error ? error.message : 'Failed to upload image',
                    variant: 'destructive'
                  })
                } finally {
                  setUploading(false)
                  URL.revokeObjectURL(previewUrl)
                }
              }
              
              img.onerror = () => {
                toast({
                  title: 'Invalid Image',
                  description: 'Could not load the selected file.',
                  variant: 'destructive'
                })
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
          render: (value: any, formData: any, onChange: any, allOnChange: any) => {
            const [jobSkills, setJobSkills] = React.useState<any[]>([]);
            const [loading, setLoading] = React.useState(true);
            const [refreshTrigger, setRefreshTrigger] = React.useState(0);

            React.useEffect(() => {
              if (role?.id) {
                setLoading(true);
                fetch(`/api/admin/roles/${role.id}/skills`)
                  .then(res => res.json())
                  .then(data => {
                    setJobSkills(data.skills || []);
                    setLoading(false);
                  })
                  .catch(() => setLoading(false));
              }
            }, [role?.id, refreshTrigger]);

            const handleRemoveSkill = (skillId: string) => {
              // Remove from local state
              const updatedSkills = jobSkills.filter(s => s.id !== skillId);
              setJobSkills(updatedSkills);
              
              // Track in localChanges for save
              setLocalChanges(prev => ({
                ...prev,
                removed_skill_ids: [...(prev.removed_skill_ids || []), skillId]
              }));
            };
            
            // Expose refresh function to parent
            React.useEffect(() => {
              (window as any).refreshSkillsList = () => setRefreshTrigger(prev => prev + 1);
            }, []);

            return (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Current Skills</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Click the X to remove a skill. Changes will be saved when you click Save.
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
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 border border-teal-600 rounded-full text-sm group"
                      >
                        <span className="font-medium text-teal-600">{js.name}</span>
                        {js.weight && (
                          <span className="text-xs text-teal-600 opacity-75">
                            {Math.round(js.weight * 100)}%
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(js.id)}
                          className="ml-1 text-teal-600 hover:text-red-600 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                          title="Remove skill"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
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
          placeholder: 'e.g., Senior Software Engineer at TechCorp | Tampa, FL',
          description: 'Title tag for search engines (50-60 characters)'
        },
        {
          key: 'meta_description',
          label: 'Meta Description',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'e.g., Join TechCorp as a Senior Software Engineer in Tampa. Competitive salary, great benefits. Apply now!',
          description: 'Brief summary for search results (150-160 characters)'
        },
        {
          key: 'og_title',
          label: 'Open Graph Title',
          type: EntityFieldType.TEXT,
          placeholder: 'e.g., We\'re Hiring: Senior Software Engineer at TechCorp 🚀',
          description: 'Title for social media shares (60-90 characters)'
        },
        {
          key: 'og_description',
          label: 'Open Graph Description',
          type: EntityFieldType.TEXTAREA,
          placeholder: 'e.g., Ready to level up your career? Join our innovative team and work on exciting projects with cutting-edge tech!',
          description: 'Description for social media shares (150-200 characters)'
        },
        {
          key: 'seo_generator',
          label: 'AI SEO Generator',
          type: EntityFieldType.CUSTOM,
          render: (value: any, formData: any, onChange: any, allOnChange: any) => {
            const [isGenerating, setIsGenerating] = React.useState(false);
            
            const handleGenerate = async () => {
              if (!role) return;
              
              setIsGenerating(true);
              try {
                const response = await fetch('/api/admin/seo-generator', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: role.title,
                    company: role.company?.name,
                    category: role.category,
                    location_city: role.location_city,
                    location_state: role.location_state,
                    median_wage_usd: role.median_wage_usd,
                    short_desc: role.short_desc,
                    long_desc: role.long_desc,
                    skills: role.skills,
                    core_responsibilities: role.core_responsibilities,
                    tasks: role.tasks,
                    tools_and_technology: role.tools_and_technology
                  })
                });
                
                const result = await response.json();
                
                if (result.success && result.data) {
                  // Update the form fields with generated data using the form's onChange handlers
                  if (allOnChange) {
                    allOnChange('seo_title', result.data.seo_title);
                    allOnChange('meta_description', result.data.meta_description);
                    allOnChange('og_title', result.data.og_title);
                    allOnChange('og_description', result.data.og_description);
                    allOnChange('slug', result.data.slug);
                  }
                  
                  // Show success message
                  toast({
                    title: 'SEO Metadata Generated',
                    description: 'Click Save to persist changes.'
                  });
                } else {
                  throw new Error(result.error || 'Unknown error from API');
                }
              } catch (error: any) {
                console.error('SEO generation failed:', error);
                const errorMessage = error.message || 'Failed to generate SEO metadata. Please try again.';
                toast({
                  title: 'SEO Generation Failed',
                  description: errorMessage,
                  variant: 'destructive'
                });
              } finally {
                setIsGenerating(false);
              }
            };
            
            return (
              <AIGenerateButton
                onClick={handleGenerate}
                buttonText={isGenerating ? 'Generating...' : 'Generate SEO with AI'}
                disabled={isGenerating || !role}
                tooltipContent={{
                  title: 'What happens when you click:',
                  points: [
                    'AI analyzes your role data from all tabs',
                    'Reviews: Title, Company, Location, Salary',
                    'Reviews: Descriptions, Skills, Responsibilities',
                    'Reviews: Tasks, Tools, and Benefits',
                    'Generates SEO-optimized titles and descriptions',
                    'Creates social media (OG) tags',
                    'Generates URL-friendly slug',
                    'Follows best practices (character limits, keywords)'
                  ]
                }}
              />
            );
          }
        },
        {
          key: 'og_image',
          label: 'Open Graph Image',
          type: EntityFieldType.CUSTOM,
          render: (value: any, formData: any, onChange: any) => {
            // Use featured_image_url if og_image is not set
            const displayValue = value || (formData as any).featured_image_url || '';
            const isInherited = !value && (formData as any).featured_image_url;
            
            return (
              <div className="space-y-3">
                {/* Heading and Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Social Media Share Image</h4>
                  <p className="text-xs text-gray-600">
                    Inheriting from your Featured Image. This image will appear when the role is shared on social media platforms like LinkedIn, Facebook, and Twitter.
                  </p>
                </div>

                {/* Image Preview */}
                {displayValue && (
                  <div className="relative w-full max-w-md">
                    <div className="aspect-[1.91/1] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={displayValue} 
                        alt="Open Graph preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"%3E%3Crect fill="%23f3f4f6" width="1200" height="630"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="24"%3EImage not found%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <div className="absolute top-2 right-2 bg-teal-600 text-white text-xs px-2 py-1 rounded-md shadow-sm">
                      Inherited from Featured Image
                    </div>
                  </div>
                )}
              </div>
            );
          }
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
    
    try {
      // Handle removed skills first if any
      const removedSkillIds = (dataToSave as any).removed_skill_ids;
      if (removedSkillIds && removedSkillIds.length > 0 && role?.id) {
        console.log('🗑️ Removing skills:', removedSkillIds);
        
        for (const skillId of removedSkillIds) {
          const response = await fetch(`/api/admin/roles/${role.id}/skills/${skillId}`, {
            method: 'DELETE'
          });
          const result = await response.json();
          console.log(`🗑️ Deleted skill ${skillId}:`, result);
        }
        
        // Remove from dataToSave so it doesn't try to save to jobs table
        delete (dataToSave as any).removed_skill_ids;
      }
      
      const savedRole = await handleSave(dataToSave);
      
      console.log('✅ Save result:', savedRole);
      
      // Clear local changes after successful save
      // handleSave now updates the entity state, so we can safely clear localChanges
      if (savedRole) {
        setLocalChanges({});
        console.log('🧹 Local changes cleared after save');
        
        // Refresh skills list if skills were removed
        if (removedSkillIds && removedSkillIds.length > 0) {
          if ((window as any).refreshSkillsList) {
            (window as any).refreshSkillsList();
          }
        }
      }
      
      if (savedRole && isNew) {
        router.push(`/admin/roles/${savedRole.id}`);
      }
      
      return savedRole;
    } catch (error) {
      console.error('❌ Save failed:', error);
      // Re-throw so EntityDetailView can handle it
      throw error;
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
