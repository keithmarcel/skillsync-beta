'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Database } from 'lucide-react'

interface SocCodeJob {
  soc_code: string
  job_count: number
  title: string
}

export default function SkillsDataPage() {
  const [socCodes, setSocCodes] = useState<SocCodeJob[]>([])
  const [loading, setLoading] = useState(true)
  const [populatingSoc, setPopulatingSoc] = useState<string | null>(null)
  const [selectedSocCode, setSelectedSocCode] = useState('')

  useEffect(() => {
    loadSocCodes()
  }, [])

  const loadSocCodes = async () => {
    try {
      const response = await fetch('/api/admin/soc-codes')
      const data = await response.json()
      setSocCodes(data.socCodes || [])
    } catch (error) {
      console.error('Failed to load SOC codes:', error)
      toast.error('Failed to load SOC codes')
    } finally {
      setLoading(false)
    }
  }

  const populateSocSkills = async (socCode: string) => {
    setPopulatingSoc(socCode)
    try {
      const response = await fetch('/api/admin/populate-job-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socCode })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Populated ${data.total_skills_added} skills for SOC ${socCode}!`)
        loadSocCodes() // Refresh data
      } else {
        toast.error(data.error || 'Failed to populate skills')
      }
    } catch (error) {
      console.error('Failed to populate skills:', error)
      toast.error('Failed to populate skills from O*NET')
    } finally {
      setPopulatingSoc(null)
    }
  }

  const populateAllSocSkills = async () => {
    setPopulatingSoc('all')
    try {
      let totalSkills = 0
      for (const socJob of socCodes) {
        try {
          const response = await fetch('/api/admin/populate-job-skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ socCode: socJob.soc_code })
          })

          const data = await response.json()
          if (data.success) {
            totalSkills += data.total_skills_added || 0
          }
        } catch (error) {
          console.warn(`Failed to populate SOC ${socJob.soc_code}:`, error)
        }
      }

      toast.success(`Completed! Added ${totalSkills} skills across all SOC codes.`)
      loadSocCodes()
    } catch (error) {
      console.error('Failed to populate all skills:', error)
      toast.error('Failed to populate skills for all SOC codes')
    } finally {
      setPopulatingSoc(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Data Management</h1>
          <p className="text-gray-600">
            Populate job skills from O*NET occupational data - upstream data source for assessments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">SOC Codes Available</h3>
            <p className="text-3xl font-bold text-blue-600">{socCodes.length}</p>
            <p className="text-sm text-gray-500">Occupational codes in system</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Jobs</h3>
            <p className="text-3xl font-bold text-green-600">
              {socCodes.reduce((sum, soc) => sum + soc.job_count, 0)}
            </p>
            <p className="text-sm text-gray-500">Jobs with SOC codes</p>
          </div>
        </div>

        {/* O*NET Population Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              <Database className="w-5 h-5 inline mr-2" />
              Populate Skills from O*NET
            </h2>
            <p className="text-gray-600">
              Fetch authoritative skills data from the U.S. Department of Labor's O*NET database for each SOC code
            </p>
          </div>

          <div className="p-6">
            {/* Bulk Actions */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={populateAllSocSkills}
                disabled={populatingSoc === 'all'}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {populatingSoc === 'all' ? 'Populating All...' : 'Populate All SOC Codes'}
              </button>

              <div className="flex gap-2">
                <select
                  value={selectedSocCode}
                  onChange={(e) => setSelectedSocCode(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select SOC Code...</option>
                  {socCodes.map(soc => (
                    <option key={soc.soc_code} value={soc.soc_code}>
                      {soc.soc_code} - {soc.title} ({soc.job_count} jobs)
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => selectedSocCode && populateSocSkills(selectedSocCode)}
                  disabled={!selectedSocCode || populatingSoc === selectedSocCode}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {populatingSoc === selectedSocCode ? 'Populating...' : 'Populate Selected'}
                </button>
              </div>
            </div>

            {/* SOC Codes Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SOC Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jobs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {socCodes.map((soc) => (
                    <tr key={soc.soc_code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {soc.soc_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {soc.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {soc.job_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => populateSocSkills(soc.soc_code)}
                          disabled={populatingSoc === soc.soc_code}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {populatingSoc === soc.soc_code ? 'Populating...' : 'Populate Skills'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How O*NET Population Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-800 mb-2">1. SOC Code Analysis</div>
              <p className="text-blue-700">
                Uses your existing SOC codes to query O*NET's occupational database
              </p>
            </div>
            <div>
              <div className="font-medium text-blue-800 mb-2">2. Skill Extraction</div>
              <p className="text-blue-700">
                Fetches authoritative knowledge, skills, and abilities for each occupation
              </p>
            </div>
            <div>
              <div className="font-medium text-blue-800 mb-2">3. Assessment Ready</div>
              <p className="text-blue-700">
                Creates job-skill relationships that power contextual AI quiz generation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
