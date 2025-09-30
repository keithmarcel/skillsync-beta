'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Database } from 'lucide-react'

interface SocCodeJob {
  soc_code: string
  job_count: number
  title: string
  skills_count?: number
}

interface Skill {
  id: string
  name: string
  category: string
  description?: string
}

export default function SkillsDataPage() {
  const [socCodes, setSocCodes] = useState<SocCodeJob[]>([])
  const [loading, setLoading] = useState(true)
  const [populatingSoc, setPopulatingSoc] = useState<string | null>(null)
  const [selectedSocCode, setSelectedSocCode] = useState('')
  const [viewingSkills, setViewingSkills] = useState<string | null>(null)
  const [skillsModalData, setSkillsModalData] = useState<Skill[]>([])
  const [loadingSkills, setLoadingSkills] = useState(false)
  
  // Progress tracking state
  const [progressInfo, setProgressInfo] = useState<{
    isActive: boolean
    current: number
    total: number
    currentSoc: string
    estimatedTimeRemaining: number
    startTime: number
  }>({
    isActive: false,
    current: 0,
    total: 0,
    currentSoc: '',
    estimatedTimeRemaining: 0,
    startTime: 0
  })

  useEffect(() => {
    loadSocCodes()
  }, [])

  // Timer effect for progress tracking
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (progressInfo.isActive && progressInfo.startTime > 0) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - progressInfo.startTime) / 1000 // seconds
        const avgTimePerSoc = progressInfo.current > 0 ? elapsed / progressInfo.current : 15
        const remaining = (progressInfo.total - progressInfo.current) * avgTimePerSoc
        
        setProgressInfo(prev => ({
          ...prev,
          estimatedTimeRemaining: Math.max(0, remaining)
        }))
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [progressInfo.isActive, progressInfo.current, progressInfo.total, progressInfo.startTime])

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
    
    // Set up progress tracking for single SOC
    setProgressInfo({
      isActive: true,
      current: 0,
      total: 1,
      currentSoc: socCode,
      estimatedTimeRemaining: 15, // ~15 seconds per SOC
      startTime: Date.now()
    })

    try {
      const response = await fetch('/api/admin/populate-job-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socCode, forceRefresh: true })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`✅ Populated ${data.total_skills_added} skills for SOC ${socCode}!`)
        setProgressInfo(prev => ({ ...prev, current: 1 }))
        loadSocCodes() // Refresh data
      } else {
        toast.error(data.error || 'Failed to populate skills from O*NET')
      }
    } catch (error) {
      console.error('Failed to populate skills:', error)
      toast.error('Failed to populate skills from O*NET')
    } finally {
      setPopulatingSoc(null)
      setProgressInfo(prev => ({ ...prev, isActive: false }))
    }
  }

  const populateAllSocSkills = async () => {
    setPopulatingSoc('all')
    
    // Set up progress tracking for all SOCs
    const totalSocs = socCodes.filter(soc => !soc.skills_count || soc.skills_count === 0).length
    setProgressInfo({
      isActive: true,
      current: 0,
      total: totalSocs,
      currentSoc: '',
      estimatedTimeRemaining: totalSocs * 15, // ~15 seconds per SOC
      startTime: Date.now()
    })

    try {
      const response = await fetch('/api/admin/populate-job-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRefresh: true })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`🎉 Completed! Populated ${data.total_skills_added} skills across ${data.processed} jobs!`)
        setProgressInfo(prev => ({ ...prev, current: prev.total }))
        loadSocCodes() // Refresh data
      } else {
        toast.error(data.error || 'Failed to populate skills')
      }
    } catch (error) {
      console.error('Failed to populate all SOC skills:', error)
      toast.error('Failed to populate skills')
    } finally {
      setPopulatingSoc(null)
      setTimeout(() => {
        setProgressInfo(prev => ({ ...prev, isActive: false }))
      }, 2000) // Keep progress visible for 2 seconds after completion
    }
  }

  const viewSocSkills = async (socCode: string) => {
    setViewingSkills(socCode)
    setLoadingSkills(true)
    try {
      const response = await fetch(`/api/admin/soc-skills/${socCode}`)
      const data = await response.json()
      
      if (data.success) {
        setSkillsModalData(data.skills || [])
      } else {
        toast.error('Failed to load skills')
        setSkillsModalData([])
      }
    } catch (error) {
      console.error('Failed to load SOC skills:', error)
      toast.error('Failed to load skills')
      setSkillsModalData([])
    } finally {
      setLoadingSkills(false)
    }
  }

  const closeSkillsModal = () => {
    setViewingSkills(null)
    setSkillsModalData([])
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
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

        {/* Progress Indicator */}
        {progressInfo.isActive && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">
                🔄 Populating Skills from O*NET
              </h3>
              <div className="text-sm text-blue-700">
                {progressInfo.current} of {progressInfo.total} completed
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-blue-200 rounded-full h-3 mb-4">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${progressInfo.total > 0 ? (progressInfo.current / progressInfo.total) * 100 : 0}%` 
                }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="text-blue-700">
                {progressInfo.currentSoc && (
                  <span>Processing: {progressInfo.currentSoc}</span>
                )}
                {!progressInfo.currentSoc && progressInfo.total > 1 && (
                  <span>Processing multiple SOC codes...</span>
                )}
              </div>
              <div className="text-blue-600">
                {progressInfo.estimatedTimeRemaining > 0 && (
                  <span>~{Math.ceil(progressInfo.estimatedTimeRemaining / 60)} min remaining</span>
                )}
              </div>
            </div>
            
            {progressInfo.current === progressInfo.total && (
              <div className="mt-3 text-green-700 font-medium">
                ✅ Population completed successfully!
              </div>
            )}
          </div>
        )}

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
                        {(soc.skills_count && soc.skills_count > 0) ? (
                          <button
                            onClick={() => viewSocSkills(soc.soc_code)}
                            className="text-green-600 hover:text-green-900"
                          >
                            View Skills ({soc.skills_count})
                          </button>
                        ) : (
                          <button
                            onClick={() => populateSocSkills(soc.soc_code)}
                            disabled={populatingSoc === soc.soc_code}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {populatingSoc === soc.soc_code ? 'Populating...' : 'Populate Skills'}
                          </button>
                        )}
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

        {/* Skills Modal */}
        {viewingSkills && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Skills for SOC {viewingSkills}
                </h3>
                <button
                  onClick={closeSkillsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingSkills ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading skills...</span>
                  </div>
                ) : skillsModalData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skillsModalData.map((skill) => (
                      <div key={skill.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{skill.name}</h4>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {skill.category}
                          </span>
                        </div>
                        {skill.description && (
                          <p className="text-sm text-gray-600">{skill.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No skills found for this SOC code.
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={closeSkillsModal}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
