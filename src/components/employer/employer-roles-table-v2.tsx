'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import DataTable from '@/components/ui/data-table'
import { employerRolesTableColumns } from '@/lib/employer-roles-table-config'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Job {
  id: string
  title: string
  short_desc: string | null
  category: string | null
  required_proficiency_pct: number
  skills_count: number
  assessments_count: number
  candidates_count: number
  is_published: boolean
}

interface EmployerRolesTableProps {
  companyId: string
}

export function EmployerRolesTableV2({ companyId }: EmployerRolesTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [publishDialog, setPublishDialog] = useState<{ open: boolean; role: any; action: 'publish' | 'unpublish' | null }>({
    open: false,
    role: null,
    action: null
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; role: any }>({
    open: false,
    role: null
  })

  useEffect(() => {
    loadJobs()
  }, [companyId])

  async function loadJobs() {
    try {
      setLoading(true)
      
      // Fetch jobs with their invitation counts
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyId)
        .eq('job_kind', 'featured_role')
        .order('title')

      if (jobsError) throw jobsError

      // For each job, count candidates and assessments
      const jobsWithCounts = await Promise.all(
        (jobsData || []).map(async (job) => {
          const requiredProficiency = job.required_proficiency_pct || 90
          
          // Count employer_invitations where candidate meets or exceeds required proficiency
          const { count: candidatesCount, error: candidatesError } = await supabase
            .from('employer_invitations')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id)
            .gte('proficiency_pct', requiredProficiency)
          
          if (candidatesError) {
            console.error(`Error counting candidates for job ${job.id}:`, candidatesError)
          }
          
          // Count assessments taken for this role
          const { count: assessmentsCount, error: assessmentsError } = await supabase
            .from('assessments')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id)
          
          if (assessmentsError) {
            console.error(`Error counting assessments for job ${job.id}:`, assessmentsError)
          }
          
          // Count skills linked to this job
          const { count: skillsCount, error: skillsError } = await supabase
            .from('job_skills')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id)
          
          if (skillsError) {
            console.error(`Error counting skills for job ${job.id}:`, skillsError)
          }
          
          return {
            ...job,
            skills_count: skillsCount || 0,
            candidates_count: candidatesCount || 0,
            assessments_count: assessmentsCount || 0
          }
        })
      )
      
      setJobs(jobsWithCounts)
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRowAction = async (action: string, row: any) => {
    try {
      switch (action) {
        case 'edit':
          router.push(`/employer/roles/${row.id}/edit`)
          break
          
        case 'view-live':
          // Open the live role page in a new tab
          window.open(`/jobs/${row.id}`, '_blank')
          break
          
        case 'view-candidates':
          // Navigate to invites tab filtered by this role
          router.push(`/employer?tab=invites&role=${row.id}`)
          break
          
        case 'toggle-publish':
          // Open confirmation dialog
          setPublishDialog({
            open: true,
            role: row,
            action: row.newPublishState ? 'publish' : 'unpublish'
          })
          break
          
        case 'duplicate':
          // Duplicate the role
          const { data: originalRole } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', row.id)
            .single()
            
          if (originalRole) {
            const { id, created_at, updated_at, ...roleData } = originalRole
            const { error } = await supabase
              .from('jobs')
              .insert({
                ...roleData,
                title: `${roleData.title} (Copy)`,
                is_published: false
              })
              
            if (error) throw error
            
            await loadJobs()
            toast({
              title: 'Success',
              description: 'Role duplicated successfully.'
            })
          }
          break
          
        case 'manage-assessment':
          router.push(`/employer/roles/${row.id}/assessment`)
          break
          
        case 'delete':
          // Open delete confirmation dialog
          setDeleteDialog({
            open: true,
            role: row
          })
          break
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
      toast({
        title: 'Error',
        description: `Failed to ${action.replace('-', ' ')}. Please try again.`,
        variant: 'destructive'
      })
    }
  }

  const handleDeleteRole = async () => {
    if (!deleteDialog.role) return
    
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', deleteDialog.role.id)
        
      if (error) throw error
      
      await loadJobs()
      toast({
        title: 'Success',
        description: 'Role deleted successfully.'
      })
      setDeleteDialog({ open: false, role: null })
    } catch (error) {
      console.error('Error deleting role:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete role. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleConfirmPublish = async () => {
    if (!publishDialog.role) return
    
    try {
      const newPublishState = publishDialog.action === 'publish'
      const { error } = await supabase
        .from('jobs')
        .update({ is_published: newPublishState })
        .eq('id', publishDialog.role.id)
        
      if (error) throw error
      
      await loadJobs()
      toast({
        title: 'Success',
        description: `Role ${newPublishState ? 'published' : 'unpublished'} successfully.`
      })
    } catch (error) {
      console.error('Error updating publish status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update role status. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setPublishDialog({ open: false, role: null, action: null })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size={60} text="Loading Roles" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 font-source-sans-pro">Manage Your Roles</h2>
        <Button 
          className="bg-teal-600 hover:bg-[#036672]"
          onClick={() => router.push('/employer/roles/new')}
          disabled={jobs.length >= 10}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Role
        </Button>
      </div>

      <DataTable
        data={jobs}
        columns={employerRolesTableColumns}
        onRowAction={handleRowAction}
        tableType="employer-roles"
        isLoading={loading}
        loadingText="Loading Roles"
      />

      {/* Role Count Alert with Progress Bar */}
      <div className={`w-full px-4 py-3 rounded-lg border ${
        jobs.length >= 10 
          ? 'bg-red-50 border-red-200' 
          : jobs.length >= 7 
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-sm font-medium ${
            jobs.length >= 10 
              ? 'text-red-900' 
              : jobs.length >= 7 
              ? 'text-yellow-900'
              : 'text-green-900'
          }`}>
            {jobs.length} of 10 featured roles used
          </p>
          {jobs.length >= 10 && (
            <span className="text-xs text-red-600 font-medium">⚠️ Limit reached</span>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              jobs.length >= 10 
                ? 'bg-red-500' 
                : jobs.length >= 7 
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${(jobs.length / 10) * 100}%` }}
          />
        </div>
        
        {jobs.length >= 10 && (
          <p className="text-xs text-red-700 mt-2">
            You've reached the maximum. Please archive or delete existing roles to add new ones.
          </p>
        )}
      </div>

      {/* Publish/Unpublish Confirmation Dialog */}
      <Dialog open={publishDialog.open} onOpenChange={(open) => !open && setPublishDialog({ open: false, role: null, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {publishDialog.action === 'publish' ? 'Publish Role?' : 'Unpublish Role?'}
            </DialogTitle>
            <DialogDescription>
              {publishDialog.action === 'publish' 
                ? `Publishing "${publishDialog.role?.title}" will make it visible to candidates and they can apply for this role.`
                : `Unpublishing "${publishDialog.role?.title}" will hide it from candidates. Existing applications will remain accessible.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialog({ open: false, role: null, action: null })}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmPublish}
              className={publishDialog.action === 'publish' ? 'bg-cyan-800 hover:bg-cyan-900' : ''}
            >
              {publishDialog.action === 'publish' ? 'Publish' : 'Unpublish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, role: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.role?.title}"? This action cannot be undone and will remove the role from all candidate favorites and applications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, role: null })}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteRole}
              variant="destructive"
            >
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
