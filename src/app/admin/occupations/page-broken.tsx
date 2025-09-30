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

      const response = await fetch('/api/admin/occupation-enrichment/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          socCodes: selectedOccupations, 
          forceRefresh 
        })
      })

      if (!response.ok) throw new Error('Failed to start enrichment')

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
        description: "Failed to start occupation enrichment",
        variant: "destructive",
      })
    }
  }

  const pollProgress = async () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/admin/occupation-enrichment/progress')
        if (!response.ok) throw new Error('Failed to get progress')
        
        const progressData = await response.json()
        
        setEnrichmentProgress(prev => {
          const newProgress = {
            ...prev,
            current: progressData.current,
            currentSOC: progressData.currentSOC,
            estimatedCompletion: progressData.estimatedCompletion ? new Date(progressData.estimatedCompletion) : null
          }

          // Check if completed
          if (progressData.current >= prev.total || progressData.status === 'completed') {
            newProgress.status = 'completed'
            clearInterval(pollInterval)
            refreshData() // Refresh the occupations table
            toast({
              title: "Enrichment Complete",
              description: `Successfully enriched ${progressData.current} occupations with BLS and CareerOneStop data`,
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
  }

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
        const skillsCount = (job as any).job_skills?.[0]?.count || 0
        return (
          <div className="text-center">
            {skillsCount > 0 ? (
              <Link 
                href={`/admin/skills?occupation=${job.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {skillsCount}
              </Link>
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
      key: 'median_wage',
      header: 'Median Wage',
      render: (value: any, job: Job) => {
        const wageData = (job as any).bls_wage_data?.[0]
        return wageData?.median_wage 
          ? `$${Number(wageData.median_wage).toLocaleString()}`
          : <span className="text-gray-400">No data</span>
      },
      sortable: false,
      width: 120
    },
    {
      key: 'employment_count',
      header: 'Employment',
      render: (value: any, job: Job) => {
        const wageData = (job as any).bls_wage_data?.[0]
        return wageData?.employment_count 
          ? Number(wageData.employment_count).toLocaleString()
          : <span className="text-gray-400">No data</span>
      },
      sortable: false,
      width: 120
    },
    {
      key: 'growth_rate',
      header: 'Growth Rate',
      render: (value: any, job: Job) => {
        const projectionData = (job as any).bls_employment_projections?.[0]
        if (!projectionData?.projected_growth_rate) {
          return <span className="text-gray-400">No data</span>
        }
        const rate = Number(projectionData.projected_growth_rate)
        const color = rate > 0 ? 'text-green-600' : rate < 0 ? 'text-red-600' : 'text-gray-600'
        return <span className={color}>{rate > 0 ? '+' : ''}{rate.toFixed(1)}%</span>
      },
      sortable: false,
      width: 100
    },
    {
      key: 'projected_openings',
      header: 'Openings',
      render: (value: any, job: Job) => {
        const projectionData = (job as any).bls_employment_projections?.[0]
        return projectionData?.projected_openings 
          ? Number(projectionData.projected_openings).toLocaleString()
          : <span className="text-gray-400">No data</span>
      },
      sortable: false,
      width: 100
    },
    {
      key: 'programs_count',
      header: 'Programs',
      render: (value: any, job: Job) => {
        const programsCount = (job as any).cos_programs_cache?.[0]?.count || 0
        return (
          <div className="text-center">
            {programsCount > 0 ? (
              <span className="text-blue-600 font-medium">{programsCount}</span>
            ) : (
              <span className="text-gray-400">0</span>
            )}
          </div>
        )
      },
      sortable: false,
      width: 100
    },
    {
      key: 'certifications_count',
      header: 'Certs',
      render: (value: any, job: Job) => {
        const certsCount = (job as any).cos_certifications_cache?.[0]?.count || 0
        return (
          <div className="text-center">
            {certsCount > 0 ? (
              <span className="text-blue-600 font-medium">{certsCount}</span>
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
        const hasWage = (job as any).bls_wage_data?.length > 0
        const hasProjections = (job as any).bls_employment_projections?.length > 0
        const hasPrograms = ((job as any).cos_programs_cache?.[0]?.count || 0) > 0
        const hasCerts = ((job as any).cos_certifications_cache?.[0]?.count || 0) > 0
        
        const enrichedCount = [hasWage, hasProjections, hasPrograms, hasCerts].filter(Boolean).length
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
        const selectedSocCodes = occupations
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
          {selectedOccupations.length > 0 && (
            <Dialog open={isEnrichmentDialogOpen} onOpenChange={setIsEnrichmentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Enrich Data ({selectedOccupations.length})
                </Button>
              </DialogTrigger>
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
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        Start Enrichment
                      </Button>
                    </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <Link href="/admin/occupations/new">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Occupation
              </Button>
            </Link>
          </div>
        </div>

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
                    className="bg-teal-600 h-1.5 rounded-full transition-all duration-300" 
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
            data={occupations || []}
            columns={columns as any}
            actions={actions}
            bulkActions={bulkActions}
            loading={isLoading}
            error={error}
            searchPlaceholder="Search occupations..."
            emptyMessage="No occupations found"
          />
        </div>
      </div>
  );
}
