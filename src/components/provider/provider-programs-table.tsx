'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Upload, MoreHorizontal } from 'lucide-react'
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

interface Program {
  id: string
  name: string
  short_desc: string | null
  program_type: string | null
  format: string | null
  is_featured: boolean
  is_published: boolean
  skills_count: number
  inquiries_count: number
}

interface ProviderProgramsTableProps {
  schoolId: string
}

export function ProviderProgramsTable({ schoolId }: ProviderProgramsTableProps) {
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [formatFilter, setFormatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPrograms()
  }, [schoolId])

  async function loadPrograms() {
    try {
      setLoading(true)
      
      let query = supabase
        .from('programs')
        .select('*')
        .eq('school_id', schoolId)
        .order('name')

      const { data, error } = await query

      if (error) throw error
      setPrograms(data || [])
    } catch (error) {
      console.error('Error loading programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPrograms = programs.filter(program => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const name = program.name?.toLowerCase() || ''
      const desc = program.short_desc?.toLowerCase() || ''
      if (!name.includes(query) && !desc.includes(query)) return false
    }

    if (typeFilter !== 'all' && program.program_type !== typeFilter) return false
    if (formatFilter !== 'all' && program.format !== formatFilter) return false
    if (statusFilter === 'published' && !program.is_published) return false
    if (statusFilter === 'unpublished' && program.is_published) return false

    return true
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredPrograms.map(p => p.id)))
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

  const allSelected = filteredPrograms.length > 0 && selectedIds.size === filteredPrograms.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredPrograms.length

  if (loading) {
    return <div className="text-center py-12">Loading programs...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Manage Your Listed Programs</h2>

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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Type: All</SelectItem>
              <SelectItem value="Certificate">Certificate</SelectItem>
              <SelectItem value="Associate's">Associate's</SelectItem>
              <SelectItem value="Bachelor Degree">Bachelor Degree</SelectItem>
              <SelectItem value="Bootcamp">Bootcamp</SelectItem>
            </SelectContent>
          </Select>

          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Format: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Format: All</SelectItem>
              <SelectItem value="Online">Online</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="In-person">In-person</SelectItem>
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
            Add New Program
          </Button>

          <Button variant="outline" className="border-teal-600 text-teal-600">
            <Upload className="w-4 h-4 mr-2" />
            Import Programs
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
                  Skills
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Featured
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Inquires
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
              {filteredPrograms.map((program) => (
                <tr key={program.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(program.id)}
                      onChange={(e) => handleSelectOne(program.id, e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {program.name || 'Program Name'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600 line-clamp-2">
                      {program.short_desc || 'No description'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">
                      {program.skills_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={program.is_featured || false}
                        readOnly
                        className="rounded border-gray-300 text-teal-600"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className="text-xs">
                      {program.program_type || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">
                      {program.inquiries_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={program.is_published || false}
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
                        <DropdownMenuItem onClick={() => router.push(`/provider/programs/${program.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUnpublish(program.id)}>
                          Unpublish Program
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(program.id)} className="text-red-600">
                          Delete Program
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPrograms.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No programs found.
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600">
        Showing {filteredPrograms.length} of {programs.length} program{programs.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

async function handleUnpublish(programId: string) {
  try {
    const { error } = await supabase
      .from('programs')
      .update({ is_published: false })
      .eq('id', programId)

    if (error) throw error
    window.location.reload()
  } catch (error) {
    console.error('Error unpublishing program:', error)
  }
}

async function handleDelete(programId: string) {
  if (!confirm('Are you sure you want to delete this program?')) return

  try {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId)

    if (error) throw error
    window.location.reload()
  } catch (error) {
    console.error('Error deleting program:', error)
  }
}
