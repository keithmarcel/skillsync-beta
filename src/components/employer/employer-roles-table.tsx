'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, MoreHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

interface Job {
  id: string
  title: string
  short_desc: string | null
  category: string | null
  required_proficiency_pct: number
  assessments_count: number
  is_published: boolean
}

interface EmployerRolesTableProps {
  companyId: string
}

export function EmployerRolesTable({ companyId }: EmployerRolesTableProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [rolesFilter, setRolesFilter] = useState('active')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadJobs()
  }, [companyId])

  async function loadJobs() {
    try {
      setLoading(true)
      
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyId)
        .eq('job_kind', 'featured_role')
        .order('title')

      const { data, error } = await query

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const title = job.title?.toLowerCase() || ''
      const desc = job.short_desc?.toLowerCase() || ''
      if (!title.includes(query) && !desc.includes(query)) return false
    }

    if (rolesFilter === 'active' && !job.is_published) return false
    if (categoryFilter !== 'all' && job.category !== categoryFilter) return false
    if (statusFilter === 'published' && !job.is_published) return false
    if (statusFilter === 'unpublished' && job.is_published) return false

    return true
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredJobs.map(j => j.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const allSelected = filteredJobs.length > 0 && selectedIds.size === filteredJobs.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredJobs.length

  if (loading) {
    return <div className="text-center py-12">Loading roles...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Manage Your Listed Roles</h2>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 items-center w-full sm:w-auto flex-wrap">
          <Select value={rolesFilter} onValueChange={setRolesFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Roles: Active" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Roles: Active</SelectItem>
              <SelectItem value="all">Roles: All</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Category: All</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Tech & Services">Tech & Services</SelectItem>
              <SelectItem value="Skilled Trades">Skilled Trades</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status: All</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="unpublished">Unpublished</SelectItem>
            </SelectContent>
          </Select>

          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Add New Role
          </Button>

          {selectedIds.size > 0 && (
            <Button variant="outline" className="border-teal-600 text-teal-600">
              Bulk Actions
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Summary
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Required Proficiency
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Assessments
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Published
                </th>
                <th className="w-20 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(job.id)}
                      onChange={(e) => handleSelectOne(job.id, e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {job.title}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600 line-clamp-2">
                      {job.short_desc || 'No description'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className="text-xs">
                      {job.category || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">
                      {job.required_proficiency_pct || 90}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">
                      {job.assessments_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={job.is_published || false}
                        readOnly
                        className="rounded border-gray-300 text-teal-600"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/employer/roles/${job.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Unpublish Role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Delete Role
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No roles found.
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600">
        Showing {filteredJobs.length} of {jobs.length} role{jobs.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
