'use client';

import { AdminTable } from '@/components/admin/AdminTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useAdminTableData } from '@/hooks/useAdminTableData';
import { useEnrichedOccupations } from '@/hooks/useEnrichedOccupations';
import { supabase } from '@/lib/supabase/client';
import { useMemo, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Job } from '@/lib/database/queries';
import { Plus, Database, TrendingUp, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface EnrichmentProgress {
  current: number
  total: number
  currentSOC: string
  status: 'idle' | 'running' | 'completed' | 'error'
  startTime: Date | null
  estimatedCompletion: Date | null
}

export default function OccupationsPage() {
  const { toast } = useToast()
  const selectQuery = `
    *, 
    company:companies(*),
    job_skills(count)
  `;
  const initialFilter = useMemo(() => ({ job_kind: 'occupation' }), []);
  const { data: occupations, isLoading, error, refreshData } = useAdminTableData<Job>('jobs', selectQuery, {
    initialFilter
  });
  
  // Get enriched data with cache table joins
  const { enrichedData: enrichedOccupations, loading: enrichmentLoading } = useEnrichedOccupations(occupations);

  // Enrichment state
  const [enrichmentProgress, setEnrichmentProgress] = useState<EnrichmentProgress>({
    current: 0,
    total: 0,
    currentSOC: '',
    status: 'idle',
    startTime: null,
    estimatedCompletion: null
  })
  const [selectedOccupations, setSelectedOccupations] = useState<string[]>([])
  const [isEnrichmentDialogOpen, setIsEnrichmentDialogOpen] = useState(false)
  const [forceRefresh, setForceRefresh] = useState(false)

  // Enrichment functions
  const startEnrichment = async () => {
    if (selectedOccupations.length === 0) {
      toast({
        title: "No Occupations Selected",
        description: "Please select occupations to enrich with BLS and CareerOneStop data",
        variant: "destructive",
      })
      return
    }

    try {
      setEnrichmentProgress({
        current: 0,
        total: selectedOccupations.length,
        currentSOC: selectedOccupations[0],
        status: 'running',
        startTime: new Date(),
        estimatedCompletion: null
      })

      console.log('Starting enrichment for SOC codes:', selectedOccupations)
      
      const response = await fetch('/api/admin/occupation-enrichment/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          socCodes: selectedOccupations, 
          forceRefresh 
        })
      })

      const responseData = await response.json()
      console.log('Enrichment API response:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to start enrichment')
      }

      // Poll for progress updates
      pollProgress()
      
      toast({
        title: "Enrichment Started",
        description: `Processing ${selectedOccupations.length} occupations with BLS and CareerOneStop data`,
      })
    } catch (error) {
      console.error('Error starting enrichment:', error)
      setEnrichmentProgress(prev => ({ ...prev, status: 'error' }))
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start occupation enrichment",
        variant: "destructive",
      })
      // Re-throw to see in console
      throw error
    }
  }

  const pollProgress = async () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/admin/occupation-enrichment/progress')
        if (!response.ok) throw new Error('Failed to get progress')
        
        const progressData = await response.json()
        
        console.log('Progress update:', progressData)
        
        // Handle both response formats
        const progress = progressData.progress || progressData
        
        setEnrichmentProgress(prev => {
          const newProgress = {
            ...prev,
            current: progress.current,
            currentSOC: progress.currentSOC,
            status: progress.status,
            estimatedCompletion: progress.estimatedCompletion ? new Date(progress.estimatedCompletion) : null
          }

          // Check if completed
          if (progress.status === 'completed') {
            clearInterval(pollInterval)
            refreshData() // Refresh the occupations table
            toast({
              title: "Enrichment Complete",
              description: `Successfully enriched ${progress.current} occupations with BLS and CareerOneStop data`,
            })
          }

          return newProgress
        })
      } catch (error) {
        console.error('Error polling progress:', error)
        clearInterval(pollInterval)
        setEnrichmentProgress(prev => ({ ...prev, status: 'error' }))
      }
    }, 2000) // Poll every 2 seconds
    
    // Return cleanup function
    return pollInterval
  }

  // Cleanup polling on component unmount
  useEffect(() => {
    let activeInterval: NodeJS.Timeout | null = null
    
    return () => {
      if (activeInterval) {
        clearInterval(activeInterval)
      }
    }
  }, [])

  const handleEnrichment = () => {
    startEnrichment()
    setIsEnrichmentDialogOpen(false)
  }

  const columns = [
    { 
      key: 'title', 
      header: 'Occupation Title', 
      sortable: true,
      width: 300
    },
    { key: 'soc_code', header: 'SOC Code', sortable: true, width: 120 },
    { key: 'category', header: 'Category', sortable: true, width: 120 },
    {
      key: 'skills_count',
      header: 'Skills',
      render: (value: any, job: Job) => {
        // Check for curated skills count first (from Skills Extractor)
        const curatedSkillsCount = (job as any).curated_skills_count || 0
        // Fall back to job_skills count
        const jobSkillsCount = (job as any).job_skills?.[0]?.count || 0
        const skillsCount = curatedSkillsCount > 0 ? curatedSkillsCount : jobSkillsCount
        const isCurated = curatedSkillsCount > 0
        
        return (
          <div className="text-center flex items-center justify-center gap-1">
            {skillsCount > 0 ? (
              <>
                <Link 
                  href={isCurated ? `/admin/skills-extractor?tab=review&soc=${job.soc_code}` : `/admin/skills?occupation=${job.id}`}
                  className="text-[#0694A2] hover:text-[#0694A2]/80 font-medium"
                >
                  {skillsCount}
                </Link>
                {isCurated && (
                  <Badge variant="default" className="text-xs">Curated</Badge>
                )}
              </>
            ) : (
              <span className="text-gray-400">0</span>
            )}
          </div>
        )
      },
      sortable: false,
      width: 120
    },
    {
      key: 'median_wage_usd',
      header: 'Median Wage (USD)',
      render: (value: any, job: Job) => {
        return job.median_wage_usd 
          ? `$${Number(job.median_wage_usd).toLocaleString()}`
          : <span className="text-gray-400">No data</span>
      },
      sortable: false,
      width: 120
    },
    {
      key: 'employment_outlook',
      header: 'Outlook',
      render: (value: any, job: Job) => {
        return job.employment_outlook 
          ? job.employment_outlook
          : <span className="text-gray-400">No data</span>
      },
      sortable: false,
      width: 150
    },
    {
      key: 'education_level',
      header: 'Education',
      render: (value: any, job: Job) => {
        return job.education_level 
          ? job.education_level
          : <span className="text-gray-400">No data</span>
      },
      sortable: false,
      width: 150
    },
    {
      key: 'bright_outlook',
      header: 'Outlook',
      render: (value: any, job: Job) => {
        if ((job as any).bright_outlook === 'Bright') {
          return <Badge variant="default" className="bg-yellow-100 text-yellow-800">⭐ Bright</Badge>
        }
        return <span className="text-gray-400">Standard</span>
      },
      sortable: false,
      width: 100
    },
    {
      key: 'tasks_count',
      header: 'Tasks',
      render: (value: any, job: Job) => {
        const tasks = (job as any).tasks
        const tasksCount = tasks ? (Array.isArray(tasks) ? tasks.length : 0) : 0
        return (
          <div className="text-center">
            {tasksCount > 0 ? (
              <span className="text-[#0694A2] font-medium">{tasksCount}</span>
            ) : (
              <span className="text-gray-400">0</span>
            )}
          </div>
        )
      },
      sortable: false,
      width: 80
    },
    {
      key: 'location',
      header: 'Location',
      render: (value: any, job: Job) => {
        if (!job) return 'National';
        return job.location_city && job.location_state
          ? `${job.location_city}, ${job.location_state}`
          : job.location_city || job.location_state || 'National';
      },
      width: 150
    },
    {
      key: 'enrichment_status',
      header: 'Data Status',
      render: (value: any, job: Job) => {
        const hasWage = !!job.median_wage_usd
        const hasOutlook = !!job.employment_outlook
        const hasEducation = !!job.education_level
        const tasks = (job as any).tasks
        const hasTasks = tasks && Array.isArray(tasks) && tasks.length > 0
        
        const enrichedCount = [hasWage, hasOutlook, hasEducation, hasTasks].filter(Boolean).length
        const totalSources = 4
        
        if (enrichedCount === totalSources) {
          return <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>
        } else if (enrichedCount > 0) {
          return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Partial ({enrichedCount}/{totalSources})</Badge>
        } else {
          return <Badge variant="outline" className="text-gray-500">No Data</Badge>
        }
      },
      sortable: false,
      width: 120
    }
  ];

  const actions = [
    {
      label: 'Edit',
      href: (job: Job) => `/admin/occupations/${job.id}`
    },
    {
      label: 'View Skills',
      href: (job: Job) => `/admin/skills?occupation=${job.id}`
    },
    {
      label: 'Delete',
      onClick: async (job: Job) => {
        const { error } = await supabase
          .from('jobs')
          .delete()
          .eq('id', job.id);
        if (error) {
          console.error('Error deleting occupation:', error);
        } else {
          refreshData();
        }
      },
      isDestructive: true,
    }
  ];

  // Bulk actions for selected occupations
  const bulkActions = [
    {
      label: 'Enrich Selected',
      onClick: (selectedIds: string[]) => {
        const selectedSocCodes = enrichedOccupations
          ?.filter(job => selectedIds.includes(job.id) && job.soc_code)
          .map(job => job.soc_code!) || []
        setSelectedOccupations(selectedSocCodes)
        setIsEnrichmentDialogOpen(true)
      },
      variant: 'default' as const
    }
  ]

  const progressPercentage = enrichmentProgress.total > 0 ? (enrichmentProgress.current / enrichmentProgress.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">High-Demand Occupations</h1>
          <p className="text-gray-600">Manage occupation data and skill requirements</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/occupations/new">
            <Button className="bg-[#0694A2] hover:bg-[#0694A2]/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Occupation
            </Button>
          </Link>
        </div>
      </div>

      {/* Enrichment Dialog */}
      <Dialog open={isEnrichmentDialogOpen} onOpenChange={setIsEnrichmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enrich Occupation Data</DialogTitle>
            <DialogDescription>
              Enhance selected occupations with BLS wage data and CareerOneStop programs
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {enrichmentProgress.status !== 'idle' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5" />
                    Enrichment Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing: {enrichmentProgress.currentSOC}</span>
                    <span>{enrichmentProgress.current} of {enrichmentProgress.total}</span>
                  </div>
                  <Progress value={progressPercentage} className="w-full" />
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Status: {enrichmentProgress.status}</span>
                    {enrichmentProgress.estimatedCompletion && (
                      <span>ETA: {enrichmentProgress.estimatedCompletion.toLocaleTimeString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={forceRefresh}
                  onChange={(e) => setForceRefresh(e.target.checked)}
                  className="rounded"
                />
                <label className="text-sm">Force refresh cached data</label>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Selected Occupations:</strong> {selectedOccupations.length}</p>
                <p><strong>Data Sources:</strong> BLS (wage data), CareerOneStop (programs & certifications)</p>
                <p><strong>Cache TTL:</strong> BLS 90 days, CareerOneStop 60 days</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedOccupations([])
                  setIsEnrichmentDialogOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  startEnrichment()
                  setIsEnrichmentDialogOpen(false)
                }}
                disabled={enrichmentProgress.status === 'running'}
                className="bg-[#0694A2] hover:bg-[#0694A2]/90"
              >
                Start Enrichment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Progress Toast */}
      {enrichmentProgress.status === 'running' && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px]">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                Enriching {enrichmentProgress.current}/{enrichmentProgress.total}
              </div>
              <div className="text-xs text-gray-600">
                Current: {enrichmentProgress.currentSOC}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-[#0694A2] h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {enrichmentProgress.status === 'completed' && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-green-200 rounded-lg shadow-lg p-4 min-w-[300px]">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <div className="text-sm font-medium text-green-900">
              Enrichment Complete ({enrichmentProgress.total} occupations)
            </div>
          </div>
        </div>
      )}

      {enrichmentProgress.status === 'error' && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-red-200 rounded-lg shadow-lg p-4 min-w-[300px]">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <div className="text-sm font-medium text-red-900">
              Enrichment Failed
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Table */}
      <div className="w-full overflow-x-auto">
        <AdminTable
          data={enrichedOccupations || []}
          columns={columns as any}
          actions={actions}
          bulkActions={bulkActions}
          loading={isLoading || enrichmentLoading}
          error={error}
          searchPlaceholder="Search occupations..."
          emptyMessage="No occupations found"
        />
      </div>
    </div>
  );
}
